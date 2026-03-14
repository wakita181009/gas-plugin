# Feature Catalog

## Entities / Topics

| Entity/Topic | Overview Doc | Description |
|-------------|-------------|-------------|
| gas-vite-plugin | `.specify/features/gas-vite-plugin/overview.md` | (Legacy) Vite-only plugin that transforms ES module output into GAS-compatible flat files |
| gas-unplugin | `.specify/features/gas-unplugin/overview.md` | Universal bundler plugin (unplugin v3) for GAS projects — supports Vite, Rollup, webpack, esbuild, Bun |
| gas-cli | `.specify/features/gas-cli/overview.md` | Extensible CLI tool for scaffolding GAS projects — 2 templates (basic, webapp) × 4 bundlers, interactive + non-interactive modes, clasp integration |

## Use Cases

| Entity/Topic | Use Case | Doc Path | Type |
|-------------|----------|----------|------|
| gas-vite-plugin | Export Stripping | `.specify/features/gas-vite-plugin/export-stripping.md` | command |
| gas-vite-plugin | Manifest Copy | `.specify/features/gas-vite-plugin/manifest-copy.md` | command |
| gas-vite-plugin | Build Defaults | `.specify/features/gas-vite-plugin/build-defaults.md` | command |
| gas-vite-plugin | Include Copy | `.specify/features/gas-vite-plugin/include-copy.md` | command |
| gas-vite-plugin | Globals Protection | `.specify/features/gas-vite-plugin/globals-protection.md` | command |
| gas-unplugin | Export Stripping | `.specify/features/gas-unplugin/export-stripping.md` | command |
| gas-unplugin | Manifest Copy | `.specify/features/gas-unplugin/manifest-copy.md` | command |
| gas-unplugin | Build Defaults | `.specify/features/gas-unplugin/build-defaults.md` | command |
| gas-unplugin | Include Copy | `.specify/features/gas-unplugin/include-copy.md` | command |
| gas-unplugin | Globals Protection | `.specify/features/gas-unplugin/globals-protection.md` | command |
| gas-unplugin | Multi-Bundler Dispatch | `.specify/features/gas-unplugin/multi-bundler-dispatch.md` | lifecycle |
| gas-cli | Scaffold Project | `.specify/features/gas-cli/scaffold-project.md` | command |
| gas-cli | Choose Bundler | `.specify/features/gas-cli/choose-bundler.md` | command |
| gas-cli | Choose Template | `.specify/features/gas-cli/choose-template.md` | command |
| gas-cli | Non-Interactive Mode | `.specify/features/gas-cli/non-interactive-mode.md` | command |
| gas-cli | clasp Integration | `.specify/features/gas-cli/clasp-integration.md` | command |

## Reverse Lookup — by Endpoint

| Endpoint | Use Case Doc |
|----------|-------------|
| `stripExportKeywords()` | `.specify/features/gas-unplugin/export-stripping.md` |
| `removeExportBlocks()` | `.specify/features/gas-unplugin/export-stripping.md` |
| `postProcessBundle()` | `.specify/features/gas-unplugin/export-stripping.md` |
| `processBundle()` | `.specify/features/gas-unplugin/export-stripping.md` |
| `resolveIncludeFiles()` | `.specify/features/gas-unplugin/include-copy.md` |
| `copyFilesFlat()` | `.specify/features/gas-unplugin/include-copy.md` |
| `detectNamesToProtect()` | `.specify/features/gas-unplugin/globals-protection.md` |
| `extractFirstInput()` | `.specify/features/gas-unplugin/multi-bundler-dispatch.md` |
| `findRootDir()` | `.specify/features/gas-unplugin/multi-bundler-dispatch.md` |
| `unpluginFactory()` | `.specify/features/gas-unplugin/overview.md`, `.specify/features/gas-unplugin/multi-bundler-dispatch.md` |
| Vite `config()` hook | `.specify/features/gas-unplugin/build-defaults.md` |
| Vite `configResolved()` hook | `.specify/features/gas-unplugin/multi-bundler-dispatch.md` |
| `transform` hook (universal) | `.specify/features/gas-unplugin/globals-protection.md` |
| Vite/Rollup `generateBundle()` | `.specify/features/gas-unplugin/export-stripping.md` |
| Vite/Rollup `closeBundle()` | `.specify/features/gas-unplugin/manifest-copy.md`, `.specify/features/gas-unplugin/include-copy.md` |
| webpack `afterEmit` | `.specify/features/gas-unplugin/multi-bundler-dispatch.md` |
| `writeBundle` (fallback) | `.specify/features/gas-unplugin/multi-bundler-dispatch.md` |
| `scaffold()` | `.specify/features/gas-cli/scaffold-project.md` |
| `renderTemplate()` | `.specify/features/gas-cli/scaffold-project.md` |
| `renderFile()` | `.specify/features/gas-cli/scaffold-project.md` |
| `getTemplate()` | `.specify/features/gas-cli/choose-template.md` |
| `getBundler()` | `.specify/features/gas-cli/choose-bundler.md` |
| `detectPackageManager()` | `.specify/features/gas-cli/overview.md` |
| `initGit()` | `.specify/features/gas-cli/scaffold-project.md` |
| `cancelAndExit()` | `.specify/features/gas-cli/non-interactive-mode.md` |

## Reverse Lookup — by File

| File Path | Related Docs |
|-----------|-------------|
| `packages/unplugin/src/index.ts` | overview, export-stripping, manifest-copy, build-defaults, include-copy, globals-protection, multi-bundler-dispatch |
| `packages/unplugin/src/core/transforms.ts` | export-stripping |
| `packages/unplugin/src/core/include.ts` | include-copy |
| `packages/unplugin/src/core/globals.ts` | globals-protection |
| `packages/unplugin/src/core/post-process.ts` | export-stripping, globals-protection |
| `packages/unplugin/src/core/utils.ts` | export-stripping, multi-bundler-dispatch |
| `packages/unplugin/src/core/types.ts` | overview, globals-protection |
| `packages/unplugin/src/vite.ts` | multi-bundler-dispatch |
| `packages/unplugin/src/rollup.ts` | multi-bundler-dispatch |
| `packages/unplugin/src/webpack.ts` | multi-bundler-dispatch |
| `packages/unplugin/src/esbuild.ts` | multi-bundler-dispatch |
| `packages/unplugin/src/bun.ts` | multi-bundler-dispatch |
| `packages/unplugin/tests/core/transforms.test.ts` | export-stripping |
| `packages/unplugin/tests/core/include.test.ts` | include-copy |
| `packages/unplugin/tests/core/globals.test.ts` | globals-protection |
| `packages/unplugin/tests/core/post-process.test.ts` | export-stripping |
| `packages/unplugin/tests/core/utils.test.ts` | export-stripping, multi-bundler-dispatch |
| `packages/unplugin/tests/exports.test.ts` | multi-bundler-dispatch |
| `packages/unplugin/tests/integration/vite.test.ts` | export-stripping, manifest-copy, build-defaults, globals-protection |
| `packages/unplugin/tests/integration/rollup.test.ts` | export-stripping, manifest-copy, globals-protection |
| `packages/unplugin/tests/integration/esbuild.test.ts` | export-stripping, manifest-copy |
| `packages/gas-vite-plugin/src/index.ts` | (legacy) gas-vite-plugin overview, all use cases |
| `packages/gas-vite-plugin/src/transforms.ts` | (legacy) gas-vite-plugin export-stripping |
| `packages/gas-vite-plugin/src/include.ts` | (legacy) gas-vite-plugin include-copy |
| `packages/gas-vite-plugin/src/types.ts` | (legacy) gas-vite-plugin overview |
| `packages/cli/src/index.ts` | gas-cli overview |
| `packages/cli/src/commands/create.ts` | gas-cli scaffold-project, choose-bundler, choose-template, non-interactive-mode, clasp-integration |
| `packages/cli/src/core/scaffold.ts` | gas-cli scaffold-project, choose-bundler, choose-template, clasp-integration |
| `packages/cli/src/core/render.ts` | gas-cli scaffold-project |
| `packages/cli/src/core/templates.ts` | gas-cli choose-bundler, choose-template |
| `packages/cli/src/core/detect.ts` | gas-cli overview |
| `packages/cli/src/core/git.ts` | gas-cli scaffold-project |
| `packages/cli/src/core/types.ts` | gas-cli overview |
| `packages/cli/tests/core/render.test.ts` | gas-cli scaffold-project |
| `packages/cli/tests/core/templates.test.ts` | gas-cli choose-bundler, choose-template |
| `packages/cli/tests/core/detect.test.ts` | gas-cli overview |
| `packages/cli/tests/core/git.test.ts` | gas-cli scaffold-project |
| `packages/cli/tests/integration/create.test.ts` | gas-cli scaffold-project, choose-template, clasp-integration |

## Reverse Lookup — by Search Tag

| Tag | Related Docs |
|-----|-------------|
| GAS | gas-unplugin overview, export-stripping, manifest-copy, build-defaults, include-copy, globals-protection |
| unplugin | gas-unplugin overview, multi-bundler-dispatch |
| export removal | gas-unplugin export-stripping |
| appsscript.json | gas-unplugin manifest-copy |
| minify | gas-unplugin build-defaults |
| code splitting | gas-unplugin build-defaults |
| inlineDynamicImports | gas-unplugin build-defaults |
| rolldownOptions | gas-unplugin build-defaults |
| rollupOptions | gas-unplugin build-defaults |
| Vite 5/6/7 | gas-unplugin build-defaults |
| Vite 8 | gas-unplugin build-defaults |
| clasp push | gas-unplugin manifest-copy |
| include | gas-unplugin include-copy |
| glob | gas-unplugin include-copy |
| HTML | gas-unplugin include-copy |
| HtmlService | gas-unplugin include-copy |
| globals | gas-unplugin globals-protection |
| autoGlobals | gas-unplugin globals-protection |
| tree-shaking | gas-unplugin globals-protection |
| unmatched globals | gas-unplugin globals-protection |
| tinyglobby | gas-unplugin include-copy |
| Vite plugin | gas-unplugin multi-bundler-dispatch |
| Rollup plugin | gas-unplugin multi-bundler-dispatch |
| webpack plugin | gas-unplugin multi-bundler-dispatch |
| esbuild plugin | gas-unplugin multi-bundler-dispatch |
| Bun plugin | gas-unplugin multi-bundler-dispatch |
| subpath exports | gas-unplugin multi-bundler-dispatch |
| handledByFramework | gas-unplugin multi-bundler-dispatch |
| CLI | gas-cli overview |
| scaffolding | gas-cli scaffold-project |
| create command | gas-cli scaffold-project, non-interactive-mode |
| template | gas-cli choose-template |
| bundler config | gas-cli choose-bundler |
| citty | gas-cli overview |
| @clack/prompts | gas-cli overview, non-interactive-mode |
| clasp | gas-cli clasp-integration |
| package manager detection | gas-cli overview |
| git init | gas-cli scaffold-project |
| non-interactive | gas-cli non-interactive-mode |
| --yes flag | gas-cli non-interactive-mode |
| --force flag | gas-cli non-interactive-mode |
