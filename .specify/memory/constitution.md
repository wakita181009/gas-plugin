# @gas-plugin/unplugin Constitution

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

The plugin ships as ESM only (`dist/*.js`) with bundled type declarations (`dist/*.d.ts`). Each bundler has its own entry point.

### V. Test-First with 100% Coverage on Core Logic

- Core modules (`transforms.ts`, `include.ts`, `post-process.ts`, `globals.ts`, `utils.ts`) enforce **100% coverage** across statements, branches, functions, and lines
- Unit tests (`tests/core/*.test.ts`) validate pure functions in isolation, mirroring `src/core/` structure
- Integration tests (`tests/integration/`) run real builds against fixture projects and assert on actual output — covers Vite, Rollup, and esbuild
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
- **Build**: Vite library mode (multiple entries: `index`, `vite`, `rollup`, `webpack`, `esbuild`, `bun`) with `vite-plugin-dts` for type generation
- **External**: `unplugin`, `vite`, `rollup`, `webpack`, `esbuild`, `node:fs`, `node:path`, `node:fs/promises`, `tinyglobby` are externalized — not bundled
- **Test apps**: `apps/gas-script` (basic GAS project), `apps/gas-webapp` (GAS web app with doGet + HTML; has its own `tsconfig.json` with `types: ["google-apps-script"]`)
- **CI**: GitHub Actions — lint, test (Node 20/22/24), build, release on tag push

## Architecture Constraints

- **Core separation**: `src/index.ts` (unplugin factory + bundler-specific hooks), `src/core/transforms.ts` (pure string transforms), `src/core/post-process.ts` (bundle post-processing pipeline), `src/core/include.ts` (glob + file copy), `src/core/globals.ts` (tree-shake detection), `src/core/types.ts` (type definitions), `src/core/utils.ts` (shared utilities). Hooks orchestrate, pure functions are testable.
- **Two runtime dependencies**: `unplugin` (universal bundler plugin framework), `tinyglobby` (glob pattern resolution). Justified: `unplugin` enables multi-bundler support from a single codebase; `tinyglobby` covers Node 20+ where `fs.glob()` is unavailable.
- **Plugin options**: `manifest`, `include`, `globals`, `autoGlobals`. New options must justify their necessity. The `GasPluginOptions` interface in `src/core/types.ts` is the public API contract.
- **Tree-shake protection**: Uses `globalThis.__gas_keep__ = [...]` injection in `transform` hook (cleaned up in post-processing). Note: `typeof <name>;` does NOT prevent tree-shaking in Rolldown — must use actual side-effect references.
- **User input in regex**: Always escape user-provided strings (e.g., `globals` names) with `escapeRegExp()` before constructing `RegExp` to prevent ReDoS.

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

**Version**: 3.1.0 | **Ratified**: 2026-03-13 | **Last Amended**: 2026-03-14
