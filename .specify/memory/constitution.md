# @gas-plugin Constitution

## Core Principles

### I. Minimalism — Do Only What GAS Requires

The plugin handles **only** the gap between bundler output and what Google Apps Script expects. Everything else (TypeScript compilation, path aliases, tree-shaking) is the bundler's job. If the bundler already handles it, we don't touch it.

- No arrow function conversion (V8 handles modern JS)
- No `console.log` → `Logger.log` conversion
- No AST parser dependency — regex-based transforms only
- Feature additions must justify why the bundler cannot handle the concern

### II. V8 Runtime Assumed

All output targets the GAS V8 runtime. No legacy transforms, no ES5 downleveling. This keeps the plugin simple and the output readable.

### III. Universal Bundler Support via unplugin

The plugin uses [unplugin](https://github.com/unjs/unplugin) to support multiple bundlers from a single codebase:

- **Vite**: `enforce: "post"`, `apply: "build"` — only runs during build, after other plugins. Uses `config`, `configResolved`, `generateBundle`, `closeBundle` hooks. Supports Vite 5/6/7 (`rollupOptions`) and Vite 8+ (`rolldownOptions`).
- **Rollup**: Uses `options` (root detection), `outputOptions`, `generateBundle`, `closeBundle` hooks.
- **webpack**: Uses `afterEmit` hook via `compiler.hooks.afterEmit.tapAsync`. Post-processes output files on disk.
- **esbuild/Bun**: Uses `setup` (root/outDir detection) + universal `writeBundle` fallback for on-disk post-processing.
- **Core transform**: `transform` hook with filter (`include: /\.[jt]sx?/`, `exclude: /\0/`) injects tree-shake protection markers.
- Bundler-specific entry points: `@gas-plugin/unplugin/vite`, `/rollup`, `/webpack`, `/esbuild`, `/bun`.

### IV. ESM Output

Both packages ship as ESM only (`dist/*.js`) with bundled type declarations (`dist/*.d.ts`).

- **unplugin**: Each bundler has its own subpath export entry point.
- **CLI**: Main entry includes shebang (`#!/usr/bin/env node`). Templates are copied to `dist/templates/` at build time.

### V. Test Coverage — 80% Minimum

All packages enforce **80% coverage** (statements, branches, functions, lines) via Vitest thresholds in `vitest.config.ts`.

- Unit tests (`tests/core/*.test.ts`) validate pure functions in isolation, mirroring `src/core/` structure
- Integration tests (`tests/integration/`) run real builds against fixture projects and assert on actual output — covers Vite, Rollup, and esbuild
- E2E tests (`e2e/`) verify end-to-end scaffolding and build workflows with 120s timeout
- Shared test infrastructure in `tests/integration/helpers.ts`: `createTestContext(fixturesDir)` factory provides `createFixture`, `readOutput`, `buildFixture`, and `cleanup` functions
- Each integration test file uses its own fixtures directory to prevent cross-test interference
- Fixtures are created and torn down per test via `beforeEach`/`afterEach` calling `cleanup`

### VI. Strict Code Quality via Biome

Biome enforces lint + format with strict rules:

- **Async safety**: `noFloatingPromises`, `noMisusedPromises`, `noNestedPromises`, `useAwait`
- **No dead code**: `noUnusedImports`, `noUnusedVariables`, `noUnusedFunctionParameters`
- **Explicit exports**: `noBarrelFile`, `noReExportAll` (except where `biome-ignore` is justified)
- **Style discipline**: `noCommonJs`, `noNonNullAssertion`, `noParameterAssign`, `noEvolvingTypes`, `noVoid`, `useNamingConvention` (camelCase/PascalCase for functions, CONSTANT_CASE allowed for const)
- **No `any`**: `noExplicitAny` — never use `any` or suppress with `biome-ignore`. If a dependency already exports a suitable type, reuse it (e.g., `BuildEnvironmentOptions` from `vite`). If no type is available, define a project-local `interface` in `src/core/types.ts` that describes the shape you need.
- **Complexity**: `noExcessiveCognitiveComplexity`
- **Console**: `noConsole: warn` — console usage requires explicit `biome-ignore` justification
- **Import ordering**: `organizeImports` assist enabled — type imports sort before value imports
- **Formatter**: 2-space indent, double quotes, trailing commas, semicolons always, `arrowParentheses: always`, `lineWidth: 100`

## Project Structure

- **Monorepo**: pnpm workspace (`packages/*`, `apps/*`)
- **Package manager**: pnpm 10.x (corepack-managed via `packageManager` field)
- **TypeScript**: ES2022 target, bundler module resolution, strict mode
- **Type definitions**: `@types/node` in `packages/unplugin` devDependencies; `@types/google-apps-script` in `apps/gas-webapp` devDependencies
- **Build (unplugin)**: Vite library mode (multiple entries: `index`, `vite`, `rollup`, `webpack`, `esbuild`, `bun`) with `vite-plugin-dts` for type generation
- **Build (CLI)**: Vite library mode (entries: `index`, `commands/create`) with shebang banner insertion and `copyTemplates()` post-build plugin
- **External (unplugin)**: `unplugin`, `vite`, `rollup`, `webpack`, `esbuild`, `node:fs`, `node:path`, `node:fs/promises`, `tinyglobby` are externalized — not bundled
- **External (CLI)**: `citty`, `@clack/prompts`, `/^node:/` are externalized — not bundled
- **Test apps**: `apps/gas-script` (basic GAS project), `apps/gas-webapp` (GAS web app with doGet + HTML; has its own `tsconfig.json` with `types: ["google-apps-script"]`)

## Packages

### @gas-plugin/unplugin

Universal bundler plugin for GAS projects.

- **Architecture**: `src/index.ts` (unplugin factory + bundler-specific hooks), `src/core/transforms.ts` (pure string transforms), `src/core/post-process.ts` (bundle post-processing pipeline), `src/core/include.ts` (glob + file copy), `src/core/globals.ts` (tree-shake detection), `src/core/types.ts` (type definitions), `src/core/utils.ts` (shared utilities). Hooks orchestrate, pure functions are testable.
- **Runtime dependencies**: `unplugin` (universal bundler plugin framework), `tinyglobby` (glob pattern resolution). Justified: `unplugin` enables multi-bundler support from a single codebase; `tinyglobby` covers Node 20+ where `fs.glob()` is unavailable.
- **Plugin options**: `manifest`, `include`, `globals`, `autoGlobals`. New options must justify their necessity. The `GasPluginOptions` interface in `src/core/types.ts` is the public API contract.
- **Tree-shake protection**: Uses `globalThis.__gas_keep__ = [...]` injection in `transform` hook (cleaned up in post-processing). Note: `typeof <name>;` does NOT prevent tree-shaking in Rolldown — must use actual side-effect references.
- **User input in regex**: Always escape user-provided strings (e.g., `globals` names) with `escapeRegExp()` before constructing `RegExp` to prevent ReDoS.

### @gas-plugin/cli

Extensible CLI tool for scaffolding GAS projects.

- **Architecture**: `src/index.ts` (citty `defineCommand` + `runMain`, lazy subcommand imports), `src/commands/create.ts` (interactive/non-interactive prompts), `src/core/scaffold.ts` (orchestrator), `src/core/render.ts` (template engine), `src/core/templates.ts` (registries), `src/core/detect.ts` (PM detection), `src/core/git.ts` (git init), `src/core/types.ts` (types).
- **Runtime dependencies**: `citty` (CLI framework, subcommand routing), `@clack/prompts` (interactive prompts). Workspace dependency on `@gas-plugin/unplugin` for version resolution.
- **Template conventions**:
  - `_`-prefixed files → `.`-prefixed at scaffold time (npm strips dotfiles from published packages)
  - `.tmpl`-suffixed files → suffix stripped at scaffold time (avoids Biome detecting nested config files)
  - `{{placeholder}}` substitution — no template engine dependency
  - `workspace:*` versions in templates → `"latest"` for published packages
- **Template directory**: `src/templates/` is copied to `dist/templates/` by the `copyTemplates()` Vite plugin at build time. Template files are excluded from TypeScript compilation and Biome linting.

## Versioning and Release

- **Shared version**: `@gas-plugin/unplugin` and `@gas-plugin/cli` always share the same version number. Bump via: `pnpm -r exec -- npm version <ver> --no-git-tag-version`
- **Release trigger**: Pushing a `v*` tag to main triggers the release workflow.
- **npm publish**: `--provenance --no-git-checks --access public`. Both packages are published sequentially.
- **prepublishOnly**: Each package runs `vite build` automatically before publish.
- **GitHub Release**: Auto-created from tag with `--generate-notes`.

## CI Pipeline

- **Trigger**: Push to main, PRs to main.
- **Jobs**:
  1. `check` — Biome lint + format (`pnpm check`)
  2. `test` — Unit/integration tests on Node 20, 22, 24 matrix (`pnpm test`)
  3. `test-bun` — Bun runtime tests
  4. `test-deno` — Deno runtime tests
  5. `build` — Build verification (`pnpm build`)
  6. `e2e` — E2E tests after build (`pnpm test:e2e`)
- **Concurrency**: New pushes cancel in-progress CI on the same ref.
- **All jobs must pass** before merge.

## What This Plugin Does NOT Do (by design)

These are intentional omissions, not TODOs:

- Arrow function → function declaration conversion
- `console.log` → `Logger.log` conversion
- Path alias detection
- TypeScript compilation
- Any AST parsing
- IIFE unwrapping (deferred; Vite library mode ES output does not produce IIFE)
- Auto-inclusion of GAS trigger names (users explicitly export or list in `globals`)

## Governance

- Constitution supersedes ad-hoc decisions
- Changes to core transforms require both unit and integration test coverage
- New plugin options require documentation in the `GasPluginOptions` interface JSDoc
- Breaking changes to the public API require a major version bump
- New runtime dependencies must be justified — prefer zero-dependency solutions when feasible

**Version**: 4.0.0 | **Ratified**: 2026-03-13 | **Last Amended**: 2026-03-14
