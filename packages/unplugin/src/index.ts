import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import type { PluginBuild as EsbuildPluginBuild } from "esbuild";
import { createUnplugin, type UnpluginContextMeta, type UnpluginOptions } from "unplugin";
import type { BuildEnvironmentOptions, UserConfig as ViteUserConfig } from "vite";
import { detectNamesToProtect } from "./core/globals.js";
import { copyFilesFlat, resolveIncludeFiles } from "./core/include.js";
import { postProcessBundle } from "./core/post-process.js";
import { removeExportBlocks, stripExportKeywords } from "./core/transforms.js";
import type { GasPluginOptions, RspackCompiler, WebpackCompiler } from "./core/types.js";
import { extractFirstInput, findRootDir, processBundle } from "./core/utils.js";

export type { GasPluginOptions, UnpluginContextMeta, UnpluginOptions };
export { postProcessBundle, removeExportBlocks, stripExportKeywords };

const GLOBALS_MARKER = "/* __GAS_GLOBALS__ */";
const PLUGIN_NAME = "@gas-plugin/unplugin";

export const unpluginFactory = (
  options: GasPluginOptions = {},
  meta: Partial<UnpluginContextMeta> = {},
): UnpluginOptions => {
  const { manifest = "appsscript.json", include = [], globals = [], autoGlobals = true } = options;

  let rootDir = process.cwd();
  let outDir = "dist";
  // Frameworks with native lifecycle hooks (Vite, Rollup, Rolldown, webpack) handle
  // post-processing and file copy in their own hooks.
  // writeBundle is a universal fallback for esbuild and Bun only.
  let handledByFramework = Boolean(
    meta.framework && meta.framework !== "esbuild" && meta.framework !== "bun",
  );
  const matchedGlobals = new Set<string>();

  function resolveOutDir(): string {
    return resolve(rootDir, outDir);
  }

  function copyFiles() {
    const resolvedOutDir = resolveOutDir();

    if (!existsSync(resolvedOutDir)) {
      mkdirSync(resolvedOutDir, { recursive: true });
    }

    const src = resolve(rootDir, manifest);
    const dest = resolve(resolvedOutDir, "appsscript.json");

    if (existsSync(src)) {
      copyFileSync(src, dest);
    } else {
      console.warn(`[${PLUGIN_NAME}] manifest not found: ${manifest}. Skipping copy.`);
    }

    if (include.length > 0) {
      const files = resolveIncludeFiles(include, rootDir);
      copyFilesFlat(files, resolvedOutDir);
    }
  }

  function detectViteMajor(build: BuildEnvironmentOptions): number {
    if (meta.versions?.vite) {
      return Number(meta.versions.vite.split(".")[0]);
    }
    try {
      const req = createRequire(import.meta.url);
      return Number((req("vite/package.json") as { version: string }).version.split(".")[0]);
    } catch {
      // Fallback: if rolldownOptions exists on user config, assume Vite 8+
      return build.rolldownOptions === undefined ? 5 : 8;
    }
  }

  function buildVite8Config(build: BuildEnvironmentOptions) {
    const rolldownOptions = build.rolldownOptions ?? {};
    const rolldownOutput = rolldownOptions.output ?? {};
    const skipSplit = !(build.lib || Array.isArray(rolldownOptions.input));

    return {
      build: {
        minify: build.minify ?? false,
        rolldownOptions: {
          ...rolldownOptions,
          output: {
            ...rolldownOutput,
            codeSplitting: skipSplit ? false : undefined,
          },
        },
      },
    };
  }

  function buildViteLegacyConfig(build: BuildEnvironmentOptions) {
    const rollupOptions = build.rollupOptions ?? {};
    const rollupOutput = rollupOptions.output ?? {};
    const skipSplit = !(build.lib || Array.isArray(rollupOptions.input));

    return {
      build: {
        minify: build.minify ?? false,
        rollupOptions: {
          ...rollupOptions,
          output: {
            ...rollupOutput,
            ...(skipSplit ? { inlineDynamicImports: true } : {}),
          },
        },
      },
    };
  }

  function warnUnmatchedGlobals() {
    for (const name of globals) {
      if (!matchedGlobals.has(name)) {
        console.warn(`[${PLUGIN_NAME}] globals: "${name}" was not found in any source module`);
      }
    }
  }

  function postProcessOutputFiles() {
    const resolvedOutDir = resolveOutDir();
    if (!existsSync(resolvedOutDir)) return;
    const files = readdirSync(resolvedOutDir);

    for (const file of files) {
      if (!/\.[jt]sx?$/.test(file) || file.endsWith(".d.ts")) continue;
      const filePath = resolve(resolvedOutDir, file);
      const content = readFileSync(filePath, "utf-8");
      const processed = postProcessBundle(content);
      if (processed !== content) {
        writeFileSync(filePath, processed, "utf-8");
      }
    }
  }

  // Shared hooks for Rollup-compatible bundlers (Rollup and Rolldown)
  const rollupCompatibleHooks = {
    options(inputOptions: { input?: unknown }) {
      handledByFramework = true;
      const firstInput = extractFirstInput(inputOptions.input);
      if (firstInput) {
        rootDir = findRootDir(firstInput, manifest);
      }
    },

    outputOptions(outputOptions: { dir?: string; inlineDynamicImports?: boolean }) {
      if (outputOptions.dir) {
        outDir = resolve(outputOptions.dir);
      }
      if (outputOptions.inlineDynamicImports === undefined) {
        outputOptions.inlineDynamicImports = true;
      }
    },

    generateBundle(_options: unknown, bundle: unknown) {
      processBundle(bundle);
    },

    closeBundle() {
      warnUnmatchedGlobals();
      copyFiles();
    },
  };

  function updateCompilationAsset(
    name: string,
    asset: { source: () => string | Buffer },
    compiler: {
      webpack?: { sources?: unknown };
      rspack?: { sources?: unknown };
    },
    compilation: {
      updateAsset?: (name: string, newSource: unknown) => void;
    },
  ) {
    if (!/\.[jt]sx?$/.test(name) || name.endsWith(".d.ts")) return;
    const source = asset.source();
    const content = typeof source === "string" ? source : source.toString("utf-8");
    const processed = postProcessBundle(content);
    if (processed === content) return;

    const sources = (compiler.webpack?.sources ?? compiler.rspack?.sources) as
      | Record<string, new (source: string) => unknown>
      | undefined;
    const RawSource = sources?.RawSource;
    if (RawSource) {
      compilation.updateAsset?.(name, new RawSource(processed));
    } else if (compilation.updateAsset) {
      compilation.updateAsset(name, {
        source: () => processed,
        size: () => Buffer.byteLength(processed),
      });
    }
  }

  function setupWebpackLikeCompiler(compiler: WebpackCompiler | RspackCompiler) {
    handledByFramework = true;
    const c = compiler as unknown as {
      options?: { context?: string; output?: { path?: string } };
      webpack?: { sources?: unknown };
      rspack?: { sources?: unknown };
      hooks?: {
        thisCompilation?: {
          tap: (name: string, cb: (compilation: Record<string, unknown>) => void) => void;
        };
        compilation?: {
          tap: (name: string, cb: (compilation: Record<string, unknown>) => void) => void;
        };
        afterEmit?: {
          tapAsync: (
            name: string,
            cb: (_compilation: unknown, callback: () => void) => void,
          ) => void;
        };
      };
    };

    if (c.options?.context) {
      rootDir = c.options.context;
    }
    if (c.options?.output?.path) {
      outDir = c.options.output.path;
    }

    let processedInCompilation = false;

    const tapProcessAssets = (compilation: Record<string, unknown>) => {
      const hooks = compilation.hooks as
        | {
            processAssets?: {
              tap: (
                options: { name: string; stage: number },
                fn: (assets: Record<string, { source: () => string | Buffer }>) => void,
              ) => void;
            };
          }
        | undefined;
      if (!hooks?.processAssets) return;
      const stage = (compilation.PROCESS_ASSETS_STAGE_OPTIMIZE as number | undefined) ?? 100;
      hooks.processAssets.tap(
        {
          name: PLUGIN_NAME,
          stage,
        },
        (assets: Record<string, { source: () => string | Buffer }>) => {
          for (const [name, asset] of Object.entries(assets)) {
            updateCompilationAsset(
              name,
              asset,
              c,
              compilation as { updateAsset?: (n: string, s: unknown) => void },
            );
          }
          processedInCompilation = true;
        },
      );
    };

    if (c.hooks?.thisCompilation) {
      c.hooks.thisCompilation.tap(PLUGIN_NAME, tapProcessAssets);
    } else if (c.hooks?.compilation) {
      c.hooks.compilation.tap(PLUGIN_NAME, tapProcessAssets);
    }

    c.hooks?.afterEmit?.tapAsync(PLUGIN_NAME, (_compilation: unknown, callback: () => void) => {
      warnUnmatchedGlobals();
      if (!processedInCompilation) {
        postProcessOutputFiles();
      }
      copyFiles();
      callback();
    });
  }

  return {
    name: PLUGIN_NAME,

    transform: {
      filter: {
        id: {
          include: [/\.[jt]sx?(\?|$)/],
          exclude: [/\0/],
        },
      },
      handler(code: string) {
        const toInject = detectNamesToProtect(code, globals, autoGlobals);

        // Track which explicit globals were matched across all modules
        for (const name of toInject) {
          if (globals.includes(name)) matchedGlobals.add(name);
        }

        if (toInject.length === 0) return;

        const refs = toInject.join(", ");
        return `${code}\n${GLOBALS_MARKER} globalThis.__gas_keep__ = [${refs}];\n`;
      },
    },

    // Vite-specific hooks
    vite: {
      enforce: "post" as const,
      apply: "build" as const,

      config(config: ViteUserConfig) {
        handledByFramework = true;
        const build: BuildEnvironmentOptions = config.build ?? {};
        const viteMajor = detectViteMajor(build);
        return viteMajor >= 8 ? buildVite8Config(build) : buildViteLegacyConfig(build);
      },

      configResolved(config: { root: string; build: { outDir: string } }) {
        rootDir = config.root;
        outDir = config.build.outDir;
      },

      generateBundle(_options: unknown, bundle: unknown) {
        processBundle(bundle);
      },

      closeBundle() {
        warnUnmatchedGlobals();
        copyFiles();
      },
    },

    // Rollup-specific hooks
    rollup: rollupCompatibleHooks,

    // Rolldown-specific hooks
    rolldown: rollupCompatibleHooks,

    webpack: setupWebpackLikeCompiler,

    rspack: setupWebpackLikeCompiler,

    // esbuild-specific hooks
    esbuild: {
      setup(build: EsbuildPluginBuild) {
        const opts = build.initialOptions;
        const firstEntry = extractFirstInput(opts.entryPoints);
        if (firstEntry) {
          rootDir = findRootDir(firstEntry, manifest);
        }
        if (opts.outdir) {
          outDir = resolve(opts.outdir);
        } else if (opts.outfile) {
          outDir = dirname(resolve(opts.outfile));
        }
      },
    },

    // writeBundle: universal fallback for esbuild/Bun (skipped when framework handles it)
    writeBundle() {
      if (handledByFramework) return;
      warnUnmatchedGlobals();
      postProcessOutputFiles();
      copyFiles();
    },
  };
};

export const unplugin = createUnplugin(unpluginFactory);

export default unplugin;
