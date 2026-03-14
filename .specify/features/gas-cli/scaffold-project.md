# Scaffold Project

## Type and Purpose

- **Type**: command
- **Purpose**: Generate a fully configured, buildable GAS project from templates and user options.

## Spec Traceability

| Spec | Section |
|------|---------|
| `.specify/specs/004-gas-cli/spec.md` | User Story 1 — Create a New GAS Project from Template (P1) |
| `.specify/specs/004-gas-cli/spec.md` | FR-001, FR-002, FR-006, FR-007, FR-008, FR-009, FR-009a, FR-013, FR-016, FR-018 |

## Business Rules

1. A project directory is created at `<cwd>/<projectName>`.
2. Shared template files (tsconfig, biome, gitignore, README) are copied and rendered with context substitution.
3. Template-specific source files (basic/webapp/library) are copied and rendered.
4. `package.json` is generated programmatically with correct name, scripts, and devDependencies for the chosen bundler.
5. `appsscript.json` is generated with per-template OAuth scopes and webapp config.
6. Bundler config is copied from the appropriate template and rendered with template-aware context (includeHtml, globalsConfig, autoGlobals).
7. Git is initialized with `.gitignore` (skipped if already in a git repo).
8. Dependencies are optionally installed via the detected package manager.
9. `_`-prefixed template files become `.`-prefixed; `.tmpl`-suffixed files have the suffix stripped.

## Inputs and Outputs

**Inputs**:
- `options: ScaffoldOptions` — projectName, template, bundler, installDeps, clasp, scriptId, packageManager, targetDir

**Outputs**:
- **Success**: Complete project directory with all files, ready to build
- **Error**: Throws if template or bundler ID is invalid

## Error Mapping

| Condition | Error | Code/Status |
|-----------|-------|-------------|
| Invalid template ID | `Error("Invalid template...")` | thrown |
| Invalid bundler ID | `Error("Unknown bundler...")` | thrown |
| Target dir not empty (no --force) | Cancel message via @clack/prompts | exit code 3 |

## Dependencies

- `node:fs`, `node:fs/promises`: File system operations
- `node:child_process`: `execSync` for git init and dependency installation
- `./render.ts`: Template string substitution
- `./templates.ts`: Template and bundler registry lookups
- `./git.ts`: Git initialization
- `./detect.ts`: Package manager detection (used by caller)

## Touched Files

| File | Role |
|------|------|
| `packages/cli/src/core/scaffold.ts` | Main orchestrator — `scaffold()`, `copyTemplateDir()`, `generatePackageJson()`, `generateManifest()`, `generateClaspFiles()`, `generateBundlerConfig()` |
| `packages/cli/src/core/render.ts` | `renderTemplate()` — `{{key}}` regex replacement; `renderFile()` — read, substitute, write |
| `packages/cli/src/core/templates.ts` | `TEMPLATES[]`, `BUNDLERS[]` static registries; `getTemplate()`, `getBundler()` lookups |
| `packages/cli/src/core/git.ts` | `initGit()` — .gitignore generation + conditional `git init` |
| `packages/cli/src/core/types.ts` | `ScaffoldOptions`, `RenderContext` interfaces |
| `packages/cli/src/templates/**` | All template source files |

## Endpoints / Interfaces

| Method | Path/Interface | Description |
|--------|---------------|-------------|
| `scaffold(options)` | `packages/cli/src/core/scaffold.ts` | Programmatic API — full scaffolding pipeline |
| `renderTemplate(content, context)` | `packages/cli/src/core/render.ts` | String substitution engine |
| `renderFile(src, dest, context)` | `packages/cli/src/core/render.ts` | File-level render + write |

## Persistence Touchpoints

Generates files in `options.targetDir`:
- `src/index.ts`, `src/utils.ts`, `src/types.ts` (template-dependent)
- `src/client.html` (webapp only)
- `tsconfig.json`, `biome.json`, `.gitignore`, `README.md`
- `package.json`, `appsscript.json`
- Bundler config file (varies by bundler)
- `.clasp.json`, `.claspignore` (clasp opt-in only)

## Related Features

- `.specify/features/gas-cli/choose-bundler.md` — bundler config generation
- `.specify/features/gas-cli/choose-template.md` — template-specific files
- `.specify/features/gas-cli/clasp-integration.md` — clasp file generation

## Related Tests

| Test | Path |
|------|------|
| Render engine tests | `packages/cli/tests/core/render.test.ts` |
| Template registry tests | `packages/cli/tests/core/templates.test.ts` |
| Git init tests | `packages/cli/tests/core/git.test.ts` |
| Integration: basic+vite scaffold | `packages/cli/tests/integration/create.test.ts` (describe: "scaffold - basic template + vite") |

## Change Impact

- Changes to `scaffold()` pipeline order affect all generated projects.
- Changes to `RenderContext` keys require updating all template files that use those placeholders.
- Changes to `generatePackageJson()` affect every scaffolded project's dependency list.
