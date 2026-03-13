import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "vite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import gasPlugin from "../../src/index.js";

const FIXTURES_DIR = resolve(import.meta.dirname, "../fixtures-globals");

function createFixture(name: string, files: Record<string, string>): string {
  const dir = resolve(FIXTURES_DIR, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  mkdirSync(resolve(dir, "src"), { recursive: true });

  for (const [path, content] of Object.entries(files)) {
    const fullPath = resolve(dir, path);
    mkdirSync(resolve(fullPath, ".."), { recursive: true });
    writeFileSync(fullPath, content);
  }

  return dir;
}

function readOutput(fixtureDir: string, fileName = "Code.js"): string {
  return readFileSync(resolve(fixtureDir, "dist", fileName), "utf-8");
}

async function buildFixture(fixtureDir: string, pluginOptions = {}) {
  await build({
    root: fixtureDir,
    logLevel: "silent",
    plugins: [gasPlugin(pluginOptions)],
    build: {
      lib: {
        entry: resolve(fixtureDir, "src/main.ts"),
        formats: ["es"],
        fileName: () => "Code.js",
      },
    },
  });
}

beforeEach(() => {
  rmSync(FIXTURES_DIR, { recursive: true, force: true });
});

afterEach(() => {
  rmSync(FIXTURES_DIR, { recursive: true, force: true });
});

// --- US2: globals option ---

describe("US2: globals option", () => {
  it("non-exported function survives tree-shaking when listed in globals", async () => {
    const dir = createFixture("globals-survive", {
      "src/main.ts": [
        "export function onOpen() {",
        '  SpreadsheetApp.getUi().createMenu("Tools").addItem("Run", "processData").addToUi();',
        "}",
        "",
        "function processData() {",
        '  Logger.log("processing");',
        "}",
      ].join("\n"),
    });

    await buildFixture(dir, { globals: ["processData"] });
    const output = readOutput(dir);

    expect(output).toMatch(/function processData\(/);
    expect(output).toMatch(/function onOpen\(/);
    expect(output).not.toMatch(/^export\s/m);
  });

  it("silently ignores function names not found in bundle", async () => {
    const dir = createFixture("globals-missing", {
      "src/main.ts": "export function onOpen() { return 1; }",
    });

    // Should not throw
    await buildFixture(dir, { globals: ["nonExistentFunction"] });
    const output = readOutput(dir);

    expect(output).toMatch(/function onOpen\(/);
    expect(output).not.toMatch(/nonExistentFunction/);
  });

  it("no duplicate when function is both exported and listed in globals", async () => {
    const dir = createFixture("globals-dedup", {
      "src/main.ts": [
        "export function onOpen() { return 1; }",
        "export function processData() { return 2; }",
      ].join("\n"),
    });

    await buildFixture(dir, { globals: ["processData"] });
    const output = readOutput(dir);

    // processData should appear exactly once as a function declaration
    const matches = output.match(/function processData\(/g);
    expect(matches).toHaveLength(1);
  });
});

// --- US3: autoGlobals toggle (tests added in Phase 5) ---

describe("US3: autoGlobals toggle", () => {
  it("autoGlobals: false — exports still stripped but no tree-shake protection", async () => {
    const dir = createFixture("auto-off-no-globals", {
      "src/main.ts": [
        "export function onOpen() { return 1; }",
        "",
        "function helperNotExported() { return 2; }",
      ].join("\n"),
    });

    await buildFixture(dir, { autoGlobals: false });
    const output = readOutput(dir);

    // Export keywords removed
    expect(output).not.toMatch(/^export\s/m);
    expect(output).toMatch(/function onOpen\(/);
    // Non-exported function may be tree-shaken (not protected)
    // We can't guarantee it's removed (depends on bundler) but it shouldn't have typeof injection
    expect(output).not.toMatch(/typeof\s+helperNotExported/);
  });

  it("autoGlobals: false with explicit globals — only listed function protected", async () => {
    const dir = createFixture("auto-off-with-globals", {
      "src/main.ts": [
        "export function onOpen() { return 1; }",
        "",
        "function protectedHelper() { return 2; }",
        "",
        "function unprotectedHelper() { return 3; }",
      ].join("\n"),
    });

    await buildFixture(dir, { autoGlobals: false, globals: ["protectedHelper"] });
    const output = readOutput(dir);

    expect(output).not.toMatch(/^export\s/m);
    expect(output).toMatch(/function onOpen\(/);
    expect(output).toMatch(/function protectedHelper\(/);
    // unprotectedHelper may be tree-shaken
  });
});
