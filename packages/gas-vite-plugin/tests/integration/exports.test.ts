import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "vite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import gasPlugin from "../../src/index.js";

const FIXTURES_DIR = resolve(import.meta.dirname, "../fixtures-exports");

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

describe("US4: Export edge cases", () => {
  it("handles export default function", async () => {
    const dir = createFixture("export-default-fn", {
      "src/main.ts": "export default function handler() { return 1; }",
    });

    await buildFixture(dir);
    const output = readOutput(dir);

    expect(output).not.toMatch(/^export\s/m);
    expect(output).toMatch(/function handler\(/);
  });

  it("handles export { foo, bar } aggregation", async () => {
    const dir = createFixture("export-aggregation", {
      "src/main.ts": [
        "function foo() { return 1; }",
        "function bar() { return 2; }",
        "export { foo, bar };",
      ].join("\n"),
    });

    await buildFixture(dir);
    const output = readOutput(dir);

    expect(output).not.toMatch(/^export\s/m);
    expect(output).toMatch(/function foo\(/);
    expect(output).toMatch(/function bar\(/);
  });

  it("handles export { foo as bar } renamed export", async () => {
    const dir = createFixture("export-renamed", {
      "src/main.ts": [
        "function myFunction() { return 1; }",
        "export { myFunction as handler };",
      ].join("\n"),
    });

    await buildFixture(dir);
    const output = readOutput(dir);

    expect(output).not.toMatch(/^export\s/m);
    expect(output).toMatch(/function myFunction\(|function handler\(/);
  });

  it("handles export class", async () => {
    const dir = createFixture("export-class", {
      "src/main.ts": [
        "export class MyService {",
        "  run() { return 1; }",
        "}",
        "export function useService() { return new MyService().run(); }",
      ].join("\n"),
    });

    await buildFixture(dir);
    const output = readOutput(dir);

    expect(output).not.toMatch(/^export\s/m);
    // rolldown may compile `export class X` to `var X = class { ... }`
    expect(output).toMatch(/class\s*\{|class MyService/);
    expect(output).toMatch(/function useService\(/);
  });

  it("handles export default expression", async () => {
    const dir = createFixture("export-default-expr", {
      "src/main.ts": [
        "const config = { timeZone: 'Asia/Tokyo' };",
        "export default config;",
        "export function getConfig() { return config; }",
      ].join("\n"),
    });

    await buildFixture(dir);
    const output = readOutput(dir);

    expect(output).not.toMatch(/^export\s+default\s/m);
    expect(output).not.toMatch(/^export\s*\{/m);
  });
});
