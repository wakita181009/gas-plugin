# gas-cli — Overview

## Purpose and Scope

`@gas-plugin/cli` is an extensible CLI tool for scaffolding Google Apps Script projects. It generates fully configured, buildable project directories with source files, bundler config, manifest, and package.json. The initial release provides a `create` subcommand; the architecture (citty subcommand router with lazy dynamic imports) supports future subcommands (e.g., `deploy`, `init`) without breaking changes.

**Invocation**: `npx @gas-plugin/cli create [project-name] [options]`

## Business Invariants

1. Every scaffolded project MUST be buildable without manual edits (`npm install && npm run build` succeeds).
2. Templates are stored as plain files with `{{placeholder}}` substitution — no template engine dependency.
3. The CLI works fully offline — all templates are bundled within the package, no network fetch required.
4. `_`-prefixed files in templates are renamed to `.`-prefixed at scaffold time (npm strips dotfiles from published packages).
5. `.tmpl`-suffixed files have the suffix stripped at scaffold time (avoids Biome detecting nested config files).
6. The CLI auto-detects the user's package manager from `npm_config_user_agent` and falls back to npm.
7. Git init is skipped if the target directory is already inside a git repository.
8. `@clack/prompts` calls always check `isCancel()` and exit with code 1 on cancellation.

## Value Objects and Validation

| Type | Location | Description |
|------|----------|-------------|
| `ScaffoldOptions` | `packages/cli/src/core/types.ts` | Full options for scaffolding: projectName, template, bundler, installDeps, clasp, scriptId, packageManager, targetDir |
| `TemplateDefinition` | `packages/cli/src/core/types.ts` | Template metadata: id, label, description, sourceDir, oauthScopes, globals, hasHtml |
| `BundlerConfig` | `packages/cli/src/core/types.ts` | Bundler metadata: id, label, configFile, importPath, buildCommand, devDependencies |
| `RenderContext` | `packages/cli/src/core/types.ts` | String substitution context: projectName, bundlerConfigFile, bundlerImport, buildCommand, oauthScopes, globals, year, plus optional template-specific keys |
| `TemplateId` | `packages/cli/src/core/types.ts` | `"basic" \| "webapp" \| "library"` |
| `BundlerId` | `packages/cli/src/core/types.ts` | `"vite" \| "rollup" \| "esbuild" \| "webpack"` |
| `PackageManager` | `packages/cli/src/core/types.ts` | `"npm" \| "pnpm" \| "yarn" \| "bun"` |

## Persistence Touchpoints

The CLI generates the following files in the target directory:

| File | Source |
|------|--------|
| `src/index.ts` | Template-specific (basic/webapp/library) |
| `src/utils.ts` | Template-specific (basic/webapp) |
| `src/types.ts` | Template-specific (library only) |
| `src/client.html` | Template-specific (webapp only) |
| `tsconfig.json` | Shared template |
| `biome.json` | Shared template (from `biome.json.tmpl`) |
| `.gitignore` | Shared template (from `_gitignore`) + git.ts |
| `README.md` | Shared template |
| `package.json` | Programmatically generated in scaffold.ts |
| `appsscript.json` | Programmatically generated in scaffold.ts |
| `{bundler}.config.{ext}` | Bundler config template |
| `.clasp.json` | Programmatically generated (clasp opt-in only) |
| `.claspignore` | Programmatically generated (clasp opt-in only) |

## Code Entry Points

| File | Role |
|------|------|
| `packages/cli/src/index.ts` | Main CLI entrypoint — citty `defineCommand` + `runMain`, lazy `create` subcommand |
| `packages/cli/src/commands/create.ts` | Create subcommand — interactive/non-interactive prompts, validation, calls `scaffold()` |
| `packages/cli/src/core/scaffold.ts` | Orchestrator — full scaffolding pipeline (copy templates, render, generate configs, git init) |
| `packages/cli/src/core/render.ts` | Template engine — `renderTemplate()` (string substitution) and `renderFile()` (file read/write) |
| `packages/cli/src/core/templates.ts` | Template/bundler registries — `TEMPLATES[]`, `BUNDLERS[]`, lookup functions |
| `packages/cli/src/core/detect.ts` | Package manager detection from `npm_config_user_agent` |
| `packages/cli/src/core/git.ts` | Git initialization and `.gitignore` generation |
| `packages/cli/src/core/types.ts` | All type definitions |
| `packages/cli/scripts/postbuild.js` | Build script — copies `src/templates/` to `dist/templates/` after Vite build |

## Related Use Cases

| Use Case | Doc Path |
|----------|----------|
| Scaffold Project | `.specify/features/gas-cli/scaffold-project.md` |
| Choose Bundler | `.specify/features/gas-cli/choose-bundler.md` |
| Choose Template | `.specify/features/gas-cli/choose-template.md` |
| Non-Interactive Mode | `.specify/features/gas-cli/non-interactive-mode.md` |
| clasp Integration | `.specify/features/gas-cli/clasp-integration.md` |

## Related Tests

| Test | Path |
|------|------|
| Render engine unit tests (8 tests) | `packages/cli/tests/core/render.test.ts` |
| Template registry unit tests (15 tests) | `packages/cli/tests/core/templates.test.ts` |
| PM detection unit tests (5 tests) | `packages/cli/tests/core/detect.test.ts` |
| Git init unit tests (3 tests) | `packages/cli/tests/core/git.test.ts` |
| Integration tests — basic+vite, webapp, library, clasp (19 tests) | `packages/cli/tests/integration/create.test.ts` |

## Change Impact

- Modifying `ScaffoldOptions` or `RenderContext` types affects scaffold.ts, create.ts, and all tests.
- Adding a new template requires: new directory under `src/templates/`, entry in `TEMPLATES` array, update to `TemplateId` type, new integration tests.
- Adding a new bundler requires: new config template under `src/templates/bundler-configs/`, entry in `BUNDLERS` array, update to `BundlerId` type, new integration tests.
- Adding a new subcommand requires: new file under `src/commands/`, lazy import entry in `src/index.ts`.
- Changes to `biome.json` root config's `files.includes` negation pattern affect whether template files are linted.
