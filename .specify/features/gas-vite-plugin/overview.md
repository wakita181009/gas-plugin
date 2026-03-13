# gas-vite-plugin — Overview

## Purpose and Scope

A Vite plugin that transforms standard TypeScript/JavaScript modules into Google Apps Script (GAS)-compatible output. GAS does not support ES module syntax, so this plugin removes all `export`/`import` statements from bundled output, copies the `appsscript.json` manifest, and applies GAS-friendly build defaults (no minification, no code splitting).

Scope boundary: this plugin only handles post-bundle transformations and build configuration. It does not perform TypeScript compilation (Vite's job), arrow function conversion (V8 handles modern JS), or `console.log` → `Logger.log` rewriting.

## Business Invariants

1. **Zero `export`/`import` in output**: Every chunk produced by the build must have all `export` keywords stripped and all `export { ... }` blocks removed. GAS cannot parse ES module syntax.
2. **Single output file**: GAS script projects require all code in flat files at the project root. Code splitting must be disabled by default.
3. **No minification by default**: GAS output must be human-readable for debugging in the Apps Script editor.
4. **Manifest must be copied**: `appsscript.json` must appear in the output directory for `clasp push` to succeed.
5. **No runtime footprint**: The plugin injects zero code into the user's GAS output.
6. **Post-processing only**: The plugin runs after all other plugins (`enforce: "post"`) and only during build (`apply: "build"`).

## Value Objects and Validation

- **`GasPluginOptions`**: `{ manifest?: string }` — path to `appsscript.json`, defaults to `"src/appsscript.json"`.
- Manifest path is resolved relative to the Vite root directory.
- If manifest file does not exist, a warning is emitted (build does not fail).

## Persistence Touchpoints

| Location | Role |
|----------|------|
| `dist/Code.js` | Bundled GAS output (transforms applied) |
| `dist/appsscript.json` | Copied manifest for `clasp push` |
| `src/appsscript.json` | Default manifest source location |

## Code Entry Points

| File | Role |
|------|------|
| `packages/gas-vite-plugin/src/index.ts` | Plugin factory function, Vite hooks (`config`, `configResolved`, `generateBundle`, `closeBundle`) |
| `packages/gas-vite-plugin/src/transforms.ts` | Pure transform functions (`stripExportKeywords`, `removeExportBlocks`) |

## Related Use Cases

| Use Case | Doc Path |
|----------|----------|
| Export Stripping | `.specify/features/gas-vite-plugin/export-stripping.md` |
| Manifest Copy | `.specify/features/gas-vite-plugin/manifest-copy.md` |
| Build Defaults | `.specify/features/gas-vite-plugin/build-defaults.md` |

## Related Tests

| Test | Path |
|------|------|
| Unit: stripExportKeywords, removeExportBlocks | `packages/gas-vite-plugin/tests/unit/transforms.test.ts` |
| Integration: US1 basic build | `packages/gas-vite-plugin/tests/integration/build.test.ts` (US1 describe) |
| Integration: US2 manifest handling | `packages/gas-vite-plugin/tests/integration/build.test.ts` (US2 describe) |
| Integration: US3 build defaults | `packages/gas-vite-plugin/tests/integration/build.test.ts` (US3 describe) |

## Change Impact

- Changing `transforms.ts` affects all output processing — rerun unit and integration tests.
- Changing Vite hook order (`enforce`, `apply`) can break the processing pipeline.
- Changing `GasPluginOptions` interface is a breaking change for consumers.
- Vite major version upgrades may change `generateBundle` / `closeBundle` APIs — test against `apps/gas-script`.
