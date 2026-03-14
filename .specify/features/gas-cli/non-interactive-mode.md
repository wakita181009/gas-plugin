# Non-Interactive Mode

## Type and Purpose

- **Type**: command
- **Purpose**: Allow scaffolding via CLI flags without interactive prompts, enabling automation and CI/CD usage.

## Spec Traceability

| Spec | Section |
|------|---------|
| `.specify/specs/004-gas-cli/spec.md` | User Story 4 — Non-Interactive Mode (P2) |
| `.specify/specs/004-gas-cli/spec.md` | FR-003, FR-011, FR-017 |

## Business Rules

1. All options can be passed as CLI flags: `--template`, `--bundler`, `--install`/`--no-install`, `--clasp`, `--script-id`, `--force`, `--yes`.
2. `--yes` (`-y`) uses default values for all unspecified options (projectName: "my-gas-app", template: "basic", bundler: "vite", install: true, clasp: false).
3. When a flag is provided, the corresponding prompt is skipped.
4. `--force` overwrites a non-empty target directory without confirmation.
5. Without `--force`, a non-empty target directory in `--yes` mode exits with code 3.
6. Invalid enum values for `--template` or `--bundler` exit with code 2 and display available options.
7. Project name is a positional argument: `gas-plugin create <project-name>`.

## Inputs and Outputs

**Inputs**:
- Positional: `project-name` (optional, defaults to "my-gas-app" with --yes)
- Flags: `--template`, `--bundler`, `--install`, `--clasp`, `--script-id`, `--force`, `--yes`

**Outputs**:
- **Success**: Scaffolded project without any prompts
- **Error**: Exit with appropriate code (1=cancelled, 2=invalid args, 3=directory conflict)

## Error Mapping

| Condition | Error | Code/Status |
|-----------|-------|-------------|
| Invalid --template value | "Invalid template: ... Available: ..." | exit code 2 |
| Invalid --bundler value | "Invalid bundler: ... Available: ..." | exit code 2 |
| Non-empty dir + --yes + no --force | "Target directory is not empty. Use --force to overwrite." | exit code 3 |
| Non-empty dir + user declines overwrite | "Operation cancelled." | exit code 3 |

## Dependencies

- `packages/cli/src/commands/create.ts`: All resolver functions check flag values before prompting

## Touched Files

| File | Role |
|------|------|
| `packages/cli/src/commands/create.ts` | `resolveProjectName()`, `resolveTemplate()`, `resolveBundler()`, `resolveConfirm()`, `checkTargetDir()` — each checks flag before prompting |

## Endpoints / Interfaces

| Method | Path/Interface | Description |
|--------|---------------|-------------|
| `gas-plugin create <name> --yes` | CLI | Non-interactive with all defaults |
| `gas-plugin create <name> -t basic -b vite --no-install` | CLI | Fully specified non-interactive |

## Persistence Touchpoints

Same as scaffold-project — generates identical project structure regardless of interactive/non-interactive mode.

## Related Features

- `.specify/features/gas-cli/scaffold-project.md` — same output produced

## Related Tests

| Test | Path |
|------|------|
| Non-interactive mode is tested implicitly via scaffold() integration tests | `packages/cli/tests/integration/create.test.ts` |

## Change Impact

- Adding new prompts to the create command requires adding corresponding CLI flags and default values.
- Changes to default values affect `--yes` mode output.
