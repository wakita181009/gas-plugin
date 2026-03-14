# Choose Template

## Type and Purpose

- **Type**: command
- **Purpose**: Allow developers to select a project template (basic, webapp) during scaffolding; generate appropriate source files and GAS configuration.

## Business Rules

1. Two templates are supported: basic (spreadsheet automation), webapp (doGet/doPost + HTML).
2. Each template defines: oauthScopes, globals, hasHtml, and a source directory.
3. **basic**: spreadsheets scope, `onOpen` global, no HTML.
4. **webapp**: external_request scope, `doGet`/`doPost` globals, has HTML, generates `webapp` config in appsscript.json.
5. Template-specific files are copied from `src/templates/{template}/` and rendered with context.
6. Bundler config is rendered with template-aware placeholders (`includeHtml`, `globalsConfig`, `autoGlobals`).
7. Invalid template IDs in non-interactive mode exit with code 2 and list available options.

## Inputs and Outputs

**Inputs**:
- `--template` / `-t`: string flag (basic | webapp)
- Interactive: `@clack/prompts` select from `TEMPLATES[]`

**Outputs**:
- Template-specific source files in `src/`
- `appsscript.json` with correct scopes and webapp config
- Bundler config with correct include/globals settings

## Error Mapping

| Condition | Error | Code/Status |
|-----------|-------|-------------|
| Invalid template value via flag | "Invalid template: ... Available: ..." | exit code 2 |
| User cancels template selection | "Operation cancelled." | exit code 1 |

## Dependencies

- `packages/cli/src/core/templates.ts`: `TEMPLATES[]` registry, `getTemplate()` lookup
- `packages/cli/src/templates/basic/`, `webapp/`: Template source files

## Touched Files

| File | Role |
|------|------|
| `packages/cli/src/core/templates.ts` | `TEMPLATES` array with 2 entries |
| `packages/cli/src/core/scaffold.ts` | `generateManifest()` — template-specific scopes and webapp config |
| `packages/cli/src/commands/create.ts` | `resolveTemplate()` — validates flag or prompts for selection |
| `packages/cli/src/templates/basic/src/index.ts` | onOpen trigger, custom menu, greet function |
| `packages/cli/src/templates/basic/src/utils.ts` | formatDate, log utilities |
| `packages/cli/src/templates/webapp/src/index.ts` | doGet/doPost handlers |
| `packages/cli/src/templates/webapp/src/utils.ts` | Server utilities |
| `packages/cli/src/templates/webapp/src/client.html` | Client HTML page |

## Endpoints / Interfaces

| Method | Path/Interface | Description |
|--------|---------------|-------------|
| `getTemplate(id)` | `packages/cli/src/core/templates.ts` | Lookup template by ID |
| `generateManifest()` | `packages/cli/src/core/scaffold.ts` | Generate appsscript.json with template-specific config |

## Persistence Touchpoints

- Template source files copied to `src/` in project directory
- `appsscript.json` with template-specific scopes
- Bundler config with template-specific include/globals settings

## Related Features

- `.specify/features/gas-cli/scaffold-project.md` — orchestrates template file copy
- `.specify/features/gas-cli/choose-bundler.md` — bundler config content depends on template type

## Related Tests

| Test | Path |
|------|------|
| Template registry tests | `packages/cli/tests/core/templates.test.ts` (describe: "TEMPLATES registry", "getTemplate") |
| Integration: webapp template | `packages/cli/tests/integration/create.test.ts` (describe: "scaffold - webapp template") |

## Change Impact

- Adding a new template requires: new directory under `src/templates/`, entry in `TEMPLATES[]`, update `TemplateId` type, new integration tests, update `appsscript.json` generation if template has special config.
- The `library` template was specified in the original spec but has not been implemented. Only `basic` and `webapp` exist in code.
