import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "vite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import gasPlugin from "../../src/index.js";

const FIXTURES_DIR = resolve(import.meta.dirname, "../fixtures-include");

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

describe("US1: include option", () => {
  it("copies HTML files flat to output directory", async () => {
    const dir = createFixture("include-html", {
      "src/main.ts": "export function doGet() { return 1; }",
      "src/index.html": `<!DOCTYPE html><html lang="en"><body>Hello</body></html>`,
      "src/appsscript.json": '{"timeZone":"Asia/Tokyo","runtimeVersion":"V8"}',
    });

    await buildFixture(dir, { include: ["src/**/*.html"] });

    expect(existsSync(resolve(dir, "dist/index.html"))).toBe(true);
    const html = readFileSync(resolve(dir, "dist/index.html"), "utf-8");
    expect(html).toContain("Hello");
  });

  it("copies multiple patterns (HTML + CSS)", async () => {
    const dir = createFixture("include-multi", {
      "src/main.ts": "export function doGet() { return 1; }",
      "src/index.html": `<html lang="en"></html>`,
      "src/styles/app.css": "body { margin: 0; }",
      "src/appsscript.json": '{"timeZone":"Asia/Tokyo","runtimeVersion":"V8"}',
    });

    await buildFixture(dir, { include: ["src/**/*.html", "src/**/*.css"] });

    expect(existsSync(resolve(dir, "dist/index.html"))).toBe(true);
    expect(existsSync(resolve(dir, "dist/app.css"))).toBe(true);
    // Flattened — no subdirectory
    expect(existsSync(resolve(dir, "dist/styles"))).toBe(false);
  });

  it("backward compatible: no include = only appsscript.json copied", async () => {
    const dir = createFixture("include-default", {
      "src/main.ts": "export function onOpen() {}",
      "src/index.html": `<html lang="en"></html>`,
      "src/appsscript.json": '{"timeZone":"Asia/Tokyo","runtimeVersion":"V8"}',
    });

    await buildFixture(dir); // no include option

    expect(existsSync(resolve(dir, "dist/appsscript.json"))).toBe(true);
    expect(existsSync(resolve(dir, "dist/index.html"))).toBe(false);
  });

  it("empty pattern match succeeds without errors", async () => {
    const dir = createFixture("include-empty", {
      "src/main.ts": "export function onOpen() {}",
      "src/appsscript.json": '{"timeZone":"Asia/Tokyo","runtimeVersion":"V8"}',
    });

    // Pattern matches no files — should not error
    await buildFixture(dir, { include: ["src/**/*.html"] });

    expect(existsSync(resolve(dir, "dist/Code.js"))).toBe(true);
    expect(existsSync(resolve(dir, "dist/appsscript.json"))).toBe(true);
  });
});
