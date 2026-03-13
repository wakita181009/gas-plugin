# gas-vite-plugin Constitution

## Core Principles

### I. Minimalism — Do Only What GAS Requires

The plugin handles **only** the gap between Vite's output and what Google Apps Script expects. Everything else (TypeScript compilation, path aliases, tree-shaking) is Vite's job. If Vite or esbuild already handles it, we don't touch it.

- No arrow function conversion (V8 handles modern JS)
- No `console.log` → `Logger.log` conversion
- No AST parser dependency — regex-based transforms via Rollup's `generateBundle` hook
- Feature additions must justify why Vite/esbuild cannot handle the concern

### II. V8 Runtime Assumed

All output targets the GAS V8 runtime. No legacy transforms, no ES5 downleveling. This keeps the plugin simple and the output readable.

### III. Vite-Native Integration

The plugin is a well-behaved Vite plugin that follows Vite's plugin API conventions:

- Uses `enforce: "post"` and `apply: "build"` — only runs during build, after other plugins
- Uses `config` hook to set sensible defaults (`minify: false`, code-splitting disabled for GAS)
- Uses `generateBundle` for post-processing (not custom loaders or resolvers)
- Uses `closeBundle` for file operations (manifest copy)
- Peer dependency: `vite >=5.0.0` (supports Vite 5, 6, 7, 8+)

### IV. Dual Output — ES + CJS

The plugin itself ships as both ESM (`dist/index.js`) and CJS (`dist/index.cjs`) with bundled type declarations (`dist/index.d.ts`). This ensures compatibility with both `import` and `require` consumers.

### V. Test-First with 100% Coverage on Core Logic

- `transforms.ts` (the core logic) enforces **100% coverage** across statements, branches, functions, and lines
- Unit tests validate each transform function in isolation
- Integration tests run real Vite builds against fixture projects and assert on actual output
- Fixtures are created and torn down per test — no shared mutable state

### VI. Strict Code Quality via Biome

Biome enforces lint + format with strict rules:

- `noFloatingPromises`, `noMisusedPromises`, `noNestedPromises` — async safety
- `noUnusedImports`, `noUnusedVariables` — no dead code
- `noBarrelFile`, `noReExportAll` — explicit exports only (except where `biome-ignore` is justified)
- `useNamingConvention` — camelCase/PascalCase for functions, CONSTANT_CASE allowed for const
- `noConsole: warn` — console usage requires explicit `biome-ignore` justification
- Formatter: 2-space indent, double quotes, trailing commas, semicolons always

## Project Structure

- **Monorepo**: pnpm workspace (`packages/*`, `apps/*`)
- **Package manager**: pnpm 10.x (corepack-managed via `packageManager` field)
- **TypeScript**: ES2022 target, bundler module resolution, strict mode
- **Build**: Vite library mode (entry: `src/index.ts`) with `vite-plugin-dts` for type generation
- **External**: `vite`, `node:fs`, `node:path`, `node:fs/promises` are externalized — not bundled

## Architecture Constraints

- **Two-file core**: `src/index.ts` (plugin factory + Vite hooks) and `src/transforms.ts` (pure string transforms). Keep this separation — hooks orchestrate, transforms are pure and testable.
- **No runtime dependencies**: The plugin has zero production dependencies. Only `vite` as peer dep.
- **Plugin options are minimal**: Currently only `manifest?: string`. New options must justify their necessity. The `GasPluginOptions` interface is the public API contract.

## What This Plugin Does NOT Do (by design)

These are intentional omissions, not TODOs:

- Arrow function → function declaration conversion
- `console.log` → `Logger.log` conversion
- Path alias detection
- TypeScript compilation
- Any AST parsing

## Governance

- Constitution supersedes ad-hoc decisions
- Changes to core transforms require both unit and integration test coverage
- New plugin options require documentation in the `GasPluginOptions` interface JSDoc
- Breaking changes to the public API require a major version bump

**Version**: 1.0.0 | **Ratified**: 2026-03-13 | **Last Amended**: 2026-03-13
