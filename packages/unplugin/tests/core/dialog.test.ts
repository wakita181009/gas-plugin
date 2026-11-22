import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  bundleDialogs,
  createSingleFileHtmlPlugin,
  resolveDialogEntries,
} from "../../src/core/dialog.js";

const TMP_BASE = resolve(process.cwd(), "tests/.tmp-dialog-tests");

beforeEach(() => {
  rmSync(TMP_BASE, { recursive: true, force: true });
  mkdirSync(TMP_BASE, { recursive: true });
});

afterEach(() => {
  rmSync(TMP_BASE, { recursive: true, force: true });
});

describe("resolveDialogEntries", () => {
  it("resolves single file string", () => {
    const htmlFile = resolve(TMP_BASE, "modal.html");
    writeFileSync(htmlFile, "<html></html>");

    const entries = resolveDialogEntries(htmlFile, TMP_BASE);
    expect(entries).toHaveLength(1);
    expect(entries[0].entry).toBe(htmlFile);
    expect(entries[0].name).toBe("modal");
  });

  it("infers name from parent directory when entry is index.html", () => {
    const dialogDir = resolve(TMP_BASE, "dialog-pointage");
    mkdirSync(dialogDir, { recursive: true });
    const indexHtml = resolve(dialogDir, "index.html");
    writeFileSync(indexHtml, "<html></html>");

    const entries = resolveDialogEntries(indexHtml, TMP_BASE);
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe("dialog-pointage");
  });

  it("resolves glob patterns", () => {
    const dirA = resolve(TMP_BASE, "dialog-a");
    const dirB = resolve(TMP_BASE, "dialog-b");
    mkdirSync(dirA, { recursive: true });
    mkdirSync(dirB, { recursive: true });
    writeFileSync(resolve(dirA, "index.html"), "<html>A</html>");
    writeFileSync(resolve(dirB, "index.html"), "<html>B</html>");

    const entries = resolveDialogEntries("*/index.html", TMP_BASE);
    expect(entries).toHaveLength(2);
    const names = entries.map((e) => e.name).sort();
    expect(names).toEqual(["dialog-a", "dialog-b"]);
  });

  it("supports object format with custom name and plugins", () => {
    const dummyPlugin = { name: "test-plugin" };
    const htmlFile = resolve(TMP_BASE, "entry.html");
    writeFileSync(htmlFile, "<html></html>");

    const entries = resolveDialogEntries(
      [
        {
          entry: htmlFile,
          name: "custom-modal",
          plugins: [dummyPlugin],
        },
      ],
      TMP_BASE,
    );

    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe("custom-modal");
    expect(entries[0].plugins).toEqual([dummyPlugin]);
  });

  it("supports config object with shared plugins", () => {
    const dummyPlugin = { name: "shared-plugin" };
    const htmlFile = resolve(TMP_BASE, "entry.html");
    writeFileSync(htmlFile, "<html></html>");

    const entries = resolveDialogEntries(
      {
        entries: [htmlFile],
        plugins: [dummyPlugin],
      },
      TMP_BASE,
    );

    expect(entries).toHaveLength(1);
    expect(entries[0].plugins).toEqual([dummyPlugin]);
  });
});

describe("createSingleFileHtmlPlugin", () => {
  it("inlines css and script into html asset and deletes external files", () => {
    const plugin = createSingleFileHtmlPlugin();

    const bundle: Record<string, { type: string; source?: string | Buffer; code?: string }> = {
      "index.html": {
        type: "asset",
        source:
          '<!DOCTYPE html><html><head><link rel="stylesheet" href="assets/style-123.css"><link rel="modulepreload" href="assets/vendor.js"></head><body><script type="module" src="assets/main-456.js"></script></body></html>',
      },
      "assets/style-123.css": {
        type: "asset",
        source: "body { background: blue; }",
      },
      "assets/main-456.js": {
        type: "chunk",
        code: 'console.log("running </script>");',
      },
    };

    plugin.generateBundle(null, bundle);

    expect(bundle["assets/style-123.css"]).toBeUndefined();
    expect(bundle["assets/main-456.js"]).toBeUndefined();
    expect(bundle["index.html"]).toBeDefined();

    const resultHtml = bundle["index.html"].source as string;
    expect(resultHtml).toContain("<style>body { background: blue; }</style>");
    expect(resultHtml).toContain('<script>console.log("running \\x3C/script>");</script>');
    expect(resultHtml).not.toContain("modulepreload");
    expect(resultHtml).not.toContain('src="assets/main-456.js"');
    expect(resultHtml).not.toContain('href="assets/style-123.css"');
  });
});

describe("bundleDialogs", () => {
  it("compiles dialog HTML and inlines assets into outDir", async () => {
    const dialogDir = resolve(TMP_BASE, "my-dialog");
    const outDir = resolve(TMP_BASE, "dist");
    mkdirSync(dialogDir, { recursive: true });
    mkdirSync(outDir, { recursive: true });

    writeFileSync(
      resolve(dialogDir, "index.html"),
      '<!DOCTYPE html><html><head><link rel="stylesheet" href="./style.css"></head><body><h1>Dialog</h1><script type="module" src="./main.ts"></script></body></html>',
    );
    writeFileSync(resolve(dialogDir, "main.ts"), 'console.log("dialog loaded");');
    writeFileSync(resolve(dialogDir, "style.css"), "h1 { color: green; }");

    await bundleDialogs(
      [
        {
          entry: resolve(dialogDir, "index.html"),
          name: "dialog-pointage",
        },
      ],
      { rootDir: TMP_BASE, outDir },
    );

    const generatedFile = resolve(outDir, "dialog-pointage.html");
    expect(existsSync(generatedFile)).toBe(true);

    const content = readFileSync(generatedFile, "utf-8");
    expect(content).toContain("<style>h1{color:green}");
    expect(content).toMatch(/console\.log\(["`']dialog loaded["`']\)/);
    expect(content).not.toContain('src="./main.ts"');
    expect(content).not.toContain('href="./style.css"');

    // Ensure temp build directory is removed
    expect(existsSync(resolve(outDir, ".tmp-dialogs"))).toBe(false);
  });
});
