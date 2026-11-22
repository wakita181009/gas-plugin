import { copyFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { globSync } from "tinyglobby";

export interface GasDialogItem {
  /**
   * Path to the HTML entry file (relative to project root or absolute).
   */
  entry: string;
  /**
   * Output file name in outDir without extension (e.g. "dialog-pointage").
   * Defaults to entry parent folder name or entry basename.
   */
  name?: string;
  /**
   * Optional custom Vite plugins to use for building this dialog (e.g. solid(), react(), etc.).
   */
  plugins?: unknown[];
}

export interface GasDialogsConfig {
  /**
   * Entry HTML file(s) or glob pattern(s).
   * E.g. "src/ui/dialogs/**\/index.html"
   */
  entries: string | string[] | GasDialogItem[];
  /**
   * Shared Vite plugins applied to all dialog entries.
   */
  plugins?: unknown[];
}

export type GasDialogsOption = string | string[] | GasDialogItem[] | GasDialogsConfig;

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type BundleAsset = { type: string; source?: string | Buffer; code?: string };
type AssetBundle = Record<string, BundleAsset>;

function inlineCssAssets(html: string, bundle: AssetBundle, deleteFiles: boolean): string {
  let result = html;
  for (const [k, v] of Object.entries(bundle)) {
    if (v.type === "asset" && k.endsWith(".css")) {
      const css = typeof v.source === "string" ? v.source : (v.source?.toString("utf-8") ?? "");
      const fileBasename = basename(k);
      const re = new RegExp(
        `<link[^>]*?href=["'][^"']*?${escapeRegExp(fileBasename)}["'][^>]*?>`,
        "gi",
      );
      result = result.replace(re, `<style>${css}</style>`);
      if (deleteFiles) {
        delete bundle[k];
      }
    }
  }
  return result;
}

function inlineJsChunks(html: string, bundle: AssetBundle, deleteFiles: boolean): string {
  let result = html;
  for (const [k, v] of Object.entries(bundle)) {
    if (v.type === "chunk" && (k.endsWith(".js") || k.endsWith(".mjs"))) {
      const code = (v.code ?? "").replace(/<(\/script>|!--)/gi, "\\x3C$1");
      const fileBasename = basename(k);
      const re = new RegExp(
        `<script[^>]*?src=["'][^"']*?${escapeRegExp(fileBasename)}["'][^>]*?></script>`,
        "gi",
      );
      result = result.replace(re, `<script>${code}</script>`);
      if (deleteFiles) {
        delete bundle[k];
      }
    }
  }
  return result;
}

export interface SingleFileHtmlPluginOptions {
  deleteInlinedFiles?: boolean;
}

/**
 * Lightweight Vite/Rollup post-processing plugin that inlines all generated CSS assets
 * and JS chunks into the single HTML output asset.
 */
export function createSingleFileHtmlPlugin(options: SingleFileHtmlPluginOptions = {}) {
  const deleteInlinedFiles = options.deleteInlinedFiles ?? true;

  return {
    name: "gas:html-singlefile",
    enforce: "post" as const,
    generateBundle(_outputOptions: unknown, bundle: AssetBundle) {
      const htmlEntry = Object.entries(bundle).find(
        ([k, v]) => v.type === "asset" && k.endsWith(".html") && typeof v.source === "string",
      );
      if (!htmlEntry || typeof htmlEntry[1].source !== "string") return;

      const htmlAssetEntry = htmlEntry[1];
      const rawSource = htmlAssetEntry.source;
      let html = typeof rawSource === "string" ? rawSource : (rawSource?.toString("utf-8") ?? "");
      html = inlineCssAssets(html, bundle, deleteInlinedFiles);
      html = inlineJsChunks(html, bundle, deleteInlinedFiles);
      html = html.replace(/<link[^>]*?rel=["']modulepreload["'][^>]*?>\s*/gi, "");
      htmlAssetEntry.source = html;
    },
  };
}

export interface ResolvedDialog {
  entry: string;
  name: string;
  plugins?: unknown[];
}

function deriveDialogName(filePath: string, customName?: string): string {
  if (customName) return customName;
  const fileName = basename(filePath);
  let name = fileName.replace(/\.html$/i, "");
  if (name === "index") {
    const parentDir = basename(dirname(filePath));
    if (parentDir && parentDir !== "." && parentDir !== "/") {
      name = parentDir;
    }
  }
  return name;
}

function resolveSingleEntry(
  pattern: string,
  rootDir: string,
  sharedPlugins?: unknown[],
): ResolvedDialog[] {
  const matches = globSync(pattern, { cwd: rootDir });
  return matches.map((match) => {
    const absMatch = resolve(rootDir, match);
    return {
      entry: absMatch,
      name: deriveDialogName(absMatch),
      plugins: sharedPlugins,
    };
  });
}

function normalizeDialogOption(option: GasDialogsOption): {
  entries: (string | GasDialogItem)[];
  sharedPlugins?: unknown[];
} {
  if (typeof option === "string") {
    return { entries: [option] };
  }
  if (Array.isArray(option)) {
    return { entries: option };
  }
  if (typeof option === "object" && option !== null && "entries" in option) {
    return {
      entries: Array.isArray(option.entries) ? option.entries : [option.entries],
      sharedPlugins: option.plugins,
    };
  }
  return { entries: [] };
}

export function resolveDialogEntries(option: GasDialogsOption, rootDir: string): ResolvedDialog[] {
  const { entries, sharedPlugins } = normalizeDialogOption(option);
  const resolved: ResolvedDialog[] = [];

  for (const item of entries) {
    if (typeof item === "string") {
      resolved.push(...resolveSingleEntry(item, rootDir, sharedPlugins));
    } else if (typeof item === "object" && item.entry) {
      const absEntry = resolve(rootDir, item.entry);
      resolved.push({
        entry: absEntry,
        name: deriveDialogName(absEntry, item.name),
        plugins: item.plugins ?? sharedPlugins,
      });
    }
  }

  return resolved;
}

export interface BundleDialogsContext {
  rootDir: string;
  outDir: string;
}

type ViteModule = { build: (config: Record<string, unknown>) => Promise<unknown> };

async function buildOneDialog(
  dialog: ResolvedDialog,
  viteModule: ViteModule,
  tempBaseDir: string,
  outDir: string,
): Promise<void> {
  const tempOutDir = resolve(tempBaseDir, dialog.name);
  await viteModule.build({
    configFile: false,
    root: dirname(dialog.entry),
    plugins: [
      ...(Array.isArray(dialog.plugins) ? dialog.plugins : []),
      createSingleFileHtmlPlugin(),
    ],
    build: {
      outDir: tempOutDir,
      emptyOutDir: true,
      assetsInlineLimit: 100_000_000,
      cssCodeSplit: false,
      rollupOptions: {
        input: dialog.entry,
      },
    },
    logLevel: "warn",
  });

  const directHtml = resolve(tempOutDir, "index.html");
  let sourceHtml: string | undefined;

  if (existsSync(directHtml)) {
    sourceHtml = directHtml;
  } else if (existsSync(tempOutDir)) {
    const htmlFiles = readdirSync(tempOutDir).filter((f) => f.endsWith(".html"));
    if (htmlFiles.length > 0) {
      sourceHtml = resolve(tempOutDir, htmlFiles[0]);
    }
  }

  if (sourceHtml && existsSync(sourceHtml)) {
    const destHtmlName = dialog.name.endsWith(".html") ? dialog.name : `${dialog.name}.html`;
    copyFileSync(sourceHtml, resolve(outDir, destHtmlName));
  }
}

/**
 * Bundle dialog HTML entries into self-contained single-file HTML outputs
 * using Vite build API.
 */
export async function bundleDialogs(
  option: GasDialogsOption,
  context: BundleDialogsContext,
): Promise<void> {
  const dialogs = resolveDialogEntries(option, context.rootDir);
  if (dialogs.length === 0) return;

  let viteModule: ViteModule;
  try {
    viteModule = await import("vite");
  } catch {
    console.warn(
      `[@gas-plugin/unplugin] Failed to import "vite". Dialog bundling requires "vite" to be installed.`,
    );
    return;
  }

  const tempBaseDir = resolve(context.outDir, ".tmp-dialogs");

  try {
    for (const dialog of dialogs) {
      await buildOneDialog(dialog, viteModule, tempBaseDir, context.outDir);
    }
  } finally {
    if (existsSync(tempBaseDir)) {
      rmSync(tempBaseDir, { recursive: true, force: true });
    }
  }
}
