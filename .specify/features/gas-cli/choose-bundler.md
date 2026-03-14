# Choose Bundler

## Type and Purpose

- **Type**: command
- **Purpose**: Allow developers to select their preferred bundler during scaffolding; generate the correct bundler config with `@gas-plugin/unplugin/*` import.

## Business Rules

1. Four bundlers are supported: vite, rollup, esbuild, webpack.
2. Each bundler has a unique config file name, `@gas-plugin/unplugin/*` import path, build command, and set of devDependencies.
3. The bundler config template is rendered with template-aware context: `includeHtml` (webapp), `globalsConfig` (templates with globals), `autoGlobals`.
4. `package.json` build script uses the bundler's `buildCommand`.
5. `package.json` devDependencies include the bundler's required packages plus `@gas-plugin/unplugin`.
6. Invalid bundler IDs in non-interactive mode exit with code 2 and list available options.

## Inputs and Outputs

**Inputs**:
- `--bundler` / `-b`: string flag (vite | rollup | esbuild | webpack)
- Interactive: `@clack/prompts` select from `BUNDLERS[]`

**Outputs**:
- Correct config file generated in project directory
- `package.json` with matching build command and devDependencies

## Error Mapping

| Condition | Error | Code/Status |
|-----------|-------|-------------|
| Invalid bundler value via flag | "Invalid bundler: ... Available: ..." | exit code 2 |
| User cancels bundler selection | "Operation cancelled." | exit code 1 |

## Dependencies

- `packages/cli/src/core/templates.ts`: `BUNDLERS[]` registry, `getBundler()` lookup
- `packages/cli/src/templates/bundler-configs/`: Config templates for each bundler

## Touched Files

| File | Role |
|------|------|
| `packages/cli/src/core/templates.ts` | `BUNDLERS` array with 4 entries |
| `packages/cli/src/core/scaffold.ts` | `generateBundlerConfig()` — copies and renders bundler config template |
| `packages/cli/src/commands/create.ts` | `resolveBundler()` — validates flag or prompts for selection |
| `packages/cli/src/templates/bundler-configs/vite.config.ts` | Vite config template |
| `packages/cli/src/templates/bundler-configs/rollup.config.mjs` | Rollup config template |
| `packages/cli/src/templates/bundler-configs/esbuild.config.mjs` | esbuild config template |
| `packages/cli/src/templates/bundler-configs/webpack.config.mjs` | webpack config template |

## Endpoints / Interfaces

| Method | Path/Interface | Description |
|--------|---------------|-------------|
| `getBundler(id)` | `packages/cli/src/core/templates.ts` | Lookup bundler by ID |
| `generateBundlerConfig()` | `packages/cli/src/core/scaffold.ts` | Generate bundler config from template |

## Persistence Touchpoints

Generates one of: `vite.config.ts`, `rollup.config.mjs`, `esbuild.config.mjs`, `webpack.config.mjs` in the project directory.

## Related Features

- `.specify/features/gas-cli/scaffold-project.md` — orchestrates bundler config generation
- `.specify/features/gas-cli/choose-template.md` — template type affects bundler config content (globals, include)

## Related Tests

| Test | Path |
|------|------|
| Bundler registry tests | `packages/cli/tests/core/templates.test.ts` (describe: "BUNDLERS registry", "getBundler") |
| Integration: vite config generation | `packages/cli/tests/integration/create.test.ts` (it: "generates vite.config.ts with correct plugin import") |

## Change Impact

- Adding a new bundler requires: new config template, new entry in `BUNDLERS[]`, update `BundlerId` type, new tests.
- Changing a bundler's `importPath` affects all generated projects for that bundler.
