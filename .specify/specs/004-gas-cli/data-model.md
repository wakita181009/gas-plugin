# Data Model: GAS CLI

**Feature**: 004-gas-cli | **Date**: 2026-03-14

## Entities

### 1. ScaffoldOptions

The resolved set of options used to drive project scaffolding. Populated from interactive prompts or CLI flags.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `projectName` | `string` | Yes | — | Directory name and `package.json` name (sanitized) |
| `template` | `"basic" \| "webapp" \| "library"` | Yes | `"basic"` | Project template type |
| `bundler` | `"vite" \| "rollup" \| "esbuild" \| "webpack"` | Yes | `"vite"` | Bundler to configure |
| `installDeps` | `boolean` | Yes | `true` | Whether to run package install after scaffolding |
| `clasp` | `boolean` | Yes | `false` | Whether to include clasp configuration files |
| `scriptId` | `string \| undefined` | No | `undefined` | GAS Script ID for `.clasp.json` (only if `clasp` is true) |
| `packageManager` | `"npm" \| "pnpm" \| "yarn" \| "bun"` | Yes | auto-detected | Package manager to use for install |
| `targetDir` | `string` | Yes | `./{projectName}` | Absolute path to output directory |

**Validation rules**:
- `projectName`: Must be a valid npm package name (lowercase, no spaces, limited special chars). Sanitized from user input.
- `targetDir`: Must be writable. If non-empty, requires user confirmation (or `--force` in non-interactive mode).
- `scriptId`: Optional; if provided, must be a non-empty string.

### 2. TemplateDefinition

Metadata about a project template registered in the template registry.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `"basic" \| "webapp" \| "library"` | Unique template identifier |
| `label` | `string` | Display name for prompts (e.g., "Basic Script") |
| `description` | `string` | Short description shown in select prompt |
| `sourceDir` | `string` | Path to template files relative to package |
| `oauthScopes` | `string[]` | Preset OAuth scopes for `appsscript.json` |
| `globals` | `string[]` | GAS globals to protect from tree-shaking |
| `hasHtml` | `boolean` | Whether template includes HTML files (triggers `include` config) |

**Template registry (static)**:

| Template | OAuth Scopes | Globals | HTML |
|----------|-------------|---------|------|
| `basic` | `["https://www.googleapis.com/auth/spreadsheets"]` | `["onOpen"]` | No |
| `webapp` | `["https://www.googleapis.com/auth/script.external_request"]` | `["doGet", "doPost"]` | Yes |
| `library` | `[]` | `[]` | No |

### 3. BundlerConfig

Metadata about a bundler choice, used to generate the correct config file.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `"vite" \| "rollup" \| "esbuild" \| "webpack"` | Bundler identifier |
| `label` | `string` | Display name for prompts |
| `configFile` | `string` | Generated config filename (e.g., `vite.config.ts`) |
| `importPath` | `string` | `@gas-plugin/unplugin/*` subpath (e.g., `@gas-plugin/unplugin/vite`) |
| `devDependencies` | `Record<string, string>` | Dependencies to add to `package.json` |
| `buildCommand` | `string` | The `build` script command for `package.json` |

**Bundler registry (static)**:

| Bundler | Config File | Import Path | Build Command |
|---------|-------------|-------------|---------------|
| `vite` | `vite.config.ts` | `@gas-plugin/unplugin/vite` | `vite build` |
| `rollup` | `rollup.config.mjs` | `@gas-plugin/unplugin/rollup` | `rollup -c` |
| `esbuild` | `esbuild.config.mjs` | `@gas-plugin/unplugin/esbuild` | `node esbuild.config.mjs` |
| `webpack` | `webpack.config.mjs` | `@gas-plugin/unplugin/webpack` | `webpack` |

### 4. RenderContext

The context object passed to the template rendering engine for `{{placeholder}}` substitution.

| Field | Type | Source |
|-------|------|--------|
| `projectName` | `string` | `ScaffoldOptions.projectName` |
| `bundlerConfigFile` | `string` | `BundlerConfig.configFile` |
| `bundlerImport` | `string` | `BundlerConfig.importPath` |
| `buildCommand` | `string` | `BundlerConfig.buildCommand` |
| `oauthScopes` | `string` | JSON-serialized array from `TemplateDefinition.oauthScopes` |
| `globals` | `string` | JSON-serialized array from `TemplateDefinition.globals` |
| `year` | `string` | Current year for LICENSE/headers |

## State Transitions

### Scaffolding Pipeline

```text
[Start] → Resolve Options → Validate Target Dir → Copy Template Files
  → Render Placeholders → Generate Bundler Config → Generate package.json
  → Generate appsscript.json → (optional) Generate clasp files
  → (optional) Git Init → (optional) Install Dependencies → [Done]
```

Each step is a pure function that takes input and returns output (or side-effects on disk). Failures at any step produce a clear error message and exit.

### Non-Interactive Resolution

When CLI flags are provided, prompts are skipped for those values:

```text
Flag provided? → Use flag value (skip prompt)
Flag missing?  → Show interactive prompt (or use default if --yes)
```
