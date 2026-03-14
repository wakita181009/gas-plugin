# clasp Integration

## Type and Purpose

- **Type**: command
- **Purpose**: Optionally generate clasp configuration files and deploy scripts during scaffolding for Google Apps Script deployment.

## Business Rules

1. clasp integration is opt-in (default: disabled).
2. When enabled, generates `.clasp.json` with `rootDir: "dist"` and scriptId (placeholder `<your-script-id>` or user-provided via `--script-id`).
3. When enabled, generates `.claspignore` excluding `node_modules/`, `src/`, `*.ts`, but keeping `appsscript.json`.
4. When enabled, adds `push` ("clasp push") and `deploy` ("clasp push && clasp deploy") scripts to `package.json`.
5. When disabled, no clasp-related files or scripts are generated.
6. The CLI does NOT handle Google OAuth or clasp login — only generates config files.

## Inputs and Outputs

**Inputs**:
- `--clasp`: boolean flag (default false)
- `--script-id`: string flag (optional, requires --clasp)
- Interactive: `@clack/prompts` confirm (default No)

**Outputs**:
- **Enabled**: `.clasp.json`, `.claspignore`, deploy scripts in `package.json`
- **Disabled**: No clasp files generated

## Error Mapping

| Condition | Error | Code/Status |
|-----------|-------|-------------|
| User cancels clasp prompt | "Operation cancelled." | exit code 1 |

## Dependencies

- `packages/cli/src/core/scaffold.ts`: `generateClaspFiles()` and `generatePackageJson()` (clasp scripts)

## Touched Files

| File | Role |
|------|------|
| `packages/cli/src/core/scaffold.ts` | `generateClaspFiles()` — writes `.clasp.json` and `.claspignore`; `generatePackageJson()` — adds push/deploy scripts when clasp enabled |
| `packages/cli/src/commands/create.ts` | `resolveConfirm()` for clasp flag; `--script-id` arg handling |

## Endpoints / Interfaces

| Method | Path/Interface | Description |
|--------|---------------|-------------|
| `gas-plugin create --clasp` | CLI | Enable clasp integration |
| `gas-plugin create --clasp --script-id ABC123` | CLI | Enable with specific Script ID |

## Persistence Touchpoints

- `.clasp.json`: `{ scriptId, rootDir: "dist" }` — generated in project directory
- `.claspignore`: Exclusion patterns — generated in project directory
- `package.json`: `scripts.push` and `scripts.deploy` — added when clasp enabled

## Related Features

- `.specify/features/gas-cli/scaffold-project.md` — clasp files are part of the scaffold pipeline

## Related Tests

| Test | Path |
|------|------|
| Integration: clasp enabled | `packages/cli/tests/integration/create.test.ts` (describe: "scaffold - clasp integration") |
| Integration: clasp disabled | `packages/cli/tests/integration/create.test.ts` (it: "does not generate clasp files when disabled") |
| Integration: custom script ID | `packages/cli/tests/integration/create.test.ts` (it: "uses provided script ID") |

## Change Impact

- Changes to `.clasp.json` structure affect all clasp-enabled scaffolded projects.
- Changes to `.claspignore` patterns affect which files are pushed to GAS.
