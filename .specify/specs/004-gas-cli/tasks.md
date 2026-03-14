# Tasks: GAS CLI - Extensible CLI Tool

**Input**: Design documents from `/specs/004-gas-cli/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED for all user stories. Target: **≥ 80% line coverage**. Each story must include unit/integration tests, and the final phase must verify overall coverage meets the threshold.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo package**: `packages/cli/src/`, `packages/cli/tests/`
- Templates: `packages/cli/src/templates/`
- Commands: `packages/cli/src/commands/`
- Core logic: `packages/cli/src/core/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the `packages/cli` package in the monorepo with build, test, and lint configuration.

- [X] T001 Create `packages/cli/` directory structure per plan.md: `src/`, `src/commands/`, `src/core/`, `src/templates/`, `tests/core/`, `tests/integration/`
- [X] T002 Create `packages/cli/package.json` with name `@gas-plugin/cli`, type `module`, bin entry `gas-plugin` → `./dist/index.js`, exports (`.` and `./create`), dependencies (`citty`, `@clack/prompts`), devDependencies (`@types/node`, `vite`, `vite-plugin-dts`, `vitest`), scripts (`build`, `test`, `test:coverage`, `prepublishOnly`)
- [X] T003 [P] Create `packages/cli/tsconfig.json` extending `../../tsconfig.json` with `declaration: true`, `outDir: dist`, `rootDir: src`
- [X] T004 [P] Create `packages/cli/vite.config.ts` with Vite library mode (ESM), single entry `src/index.ts`, externalize `citty`, `@clack/prompts`, `node:*` builtins; add `vite-plugin-dts` for type generation; add postbuild copy of `src/templates/` → `dist/templates/`
- [X] T005 [P] Create `packages/cli/vitest.config.ts` with v8 coverage provider, include `tests/**/*.test.ts`, coverage thresholds `{ lines: 80, functions: 80, branches: 80, statements: 80 }` on `src/core/`
- [X] T006 Run `pnpm install` from workspace root to install new package dependencies

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, template rendering engine, and CLI entrypoint that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 Create shared type definitions in `packages/cli/src/core/types.ts`: `ScaffoldOptions`, `TemplateDefinition`, `BundlerConfig`, `RenderContext` interfaces per data-model.md
- [X] T008 [P] Implement string substitution engine in `packages/cli/src/core/render.ts`: function `renderTemplate(content: string, context: RenderContext): string` replacing `{{key}}` patterns; function `renderFile(srcPath: string, destPath: string, context: RenderContext): Promise<void>` reading file, substituting, writing result; handle missing keys by leaving placeholder as-is
- [X] T009 [P] Implement template registry in `packages/cli/src/core/templates.ts`: static arrays for `TEMPLATES: TemplateDefinition[]` (basic, webapp, library with oauthScopes, globals, hasHtml per data-model.md) and `BUNDLERS: BundlerConfig[]` (vite, rollup, esbuild, webpack with configFile, importPath, devDependencies, buildCommand per data-model.md); export lookup functions `getTemplate(id)`, `getBundler(id)`
- [X] T010 [P] Implement package manager detection in `packages/cli/src/core/detect.ts`: function `detectPackageManager(): "npm" | "pnpm" | "yarn" | "bun"` using `process.env.npm_config_user_agent` with fallback to npm per research.md R5
- [X] T011 [P] Implement git init logic in `packages/cli/src/core/git.ts`: function `initGit(targetDir: string): Promise<void>` that checks if already inside a git repo (skip if so), runs `git init`, writes `.gitignore` with `node_modules/`, `dist/`, `.clasp.json`
- [X] T012 Implement scaffolding orchestrator in `packages/cli/src/core/scaffold.ts`: function `scaffold(options: ScaffoldOptions): Promise<void>` that executes the pipeline: validate target dir → copy template files (using `_` prefix → dotfile rename) → render placeholders → generate bundler config → generate package.json → generate appsscript.json → (optional) clasp files → git init → (optional) install deps via detected PM
- [X] T013 Create main CLI entrypoint in `packages/cli/src/index.ts`: use `citty` `defineCommand` + `runMain` with `meta` (name, version from package.json), `subCommands` with lazy `create` import: `create: () => import("./commands/create").then(m => m.default)`
- [X] T014 Add shebang line (`#!/usr/bin/env node`) handling: ensure `dist/index.js` has shebang after build (configure in vite.config.ts banner or postbuild script)

**Checkpoint**: Foundation ready — CLI runs `gas-plugin --help` and shows `create` subcommand. Core utilities are ready for user story implementation.

---

## Phase 3: User Story 1 — Create a New GAS Project from Template (Priority: P1) 🎯 MVP

**Goal**: A developer runs `npx @gas-plugin/cli create`, answers prompts, and gets a fully configured, buildable GAS project.

**Independent Test**: Run create in a temp dir with basic template + Vite bundler, verify file structure, run `npm install && npm run build` successfully.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T015 [P] [US1] Unit test for render engine in `packages/cli/tests/core/render.test.ts`: test `{{key}}` substitution, missing keys left as-is, multiple placeholders, empty content, special chars in values
- [X] T016 [P] [US1] Unit test for template registry in `packages/cli/tests/core/templates.test.ts`: test `getTemplate("basic")` returns correct definition, `getTemplate("invalid")` returns undefined, `getBundler("vite")` returns correct config, all templates have required fields
- [X] T017 [P] [US1] Unit test for package manager detection in `packages/cli/tests/core/detect.test.ts`: test `npm_config_user_agent` parsing for npm/pnpm/yarn/bun, fallback to npm when env var missing
- [X] T018 [P] [US1] Unit test for git init in `packages/cli/tests/core/git.test.ts`: test git init in empty dir, skip when already in git repo, .gitignore content
- [X] T019 [P] [US1] Unit test for scaffold pipeline in `packages/cli/tests/core/scaffold.test.ts`: test full pipeline with mocked fs (basic template + vite), verify all expected files created, verify placeholder substitution in generated files, verify package.json has correct deps/scripts
- [X] T020 [US1] Integration test in `packages/cli/tests/integration/create.test.ts`: run scaffold in real temp dir with basic template + Vite, verify: directory created, `src/index.ts` exists, `vite.config.ts` exists with `@gas-plugin/unplugin/vite`, `package.json` has `build` script and correct deps, `appsscript.json` has spreadsheet scope, `tsconfig.json` exists, `biome.json` exists, `.gitignore` exists

### Implementation for User Story 1

- [X] T021 [P] [US1] Create basic template files in `packages/cli/src/templates/basic/`: `src/index.ts` (onOpen trigger + sample function), `src/utils.ts` (utility module)
- [X] T022 [P] [US1] Create shared template files in `packages/cli/src/templates/shared/`: `tsconfig.json` (ES2022, strict, GAS-appropriate settings), `biome.json` (lint + format, inheriting gas-plugin conventions), `_gitignore` (node_modules/, dist/, .clasp.json), `README.md` (getting started with `{{projectName}}`, `{{buildCommand}}` placeholders)
- [X] T023 [P] [US1] Create Vite bundler config template in `packages/cli/src/templates/bundler-configs/vite.config.ts` with `{{bundlerImport}}`, `{{globals}}`, `{{oauthScopes}}` placeholders and proper `build.lib` settings for GAS output
- [X] T024 [P] [US1] Create `appsscript.json` template in `packages/cli/src/templates/shared/appsscript.json` with `{{oauthScopes}}` placeholder, `runtimeVersion: "V8"`
- [X] T025 [P] [US1] Create `package.json` template in `packages/cli/src/templates/shared/package.json` with `{{projectName}}`, `{{buildCommand}}`, dependency placeholders
- [X] T026 [US1] Implement `create` command in `packages/cli/src/commands/create.ts`: use `citty` `defineCommand` with positional `name` arg; use `@clack/prompts` `intro`, `text` (project name), `select` (template), `select` (bundler), `confirm` (install deps) with `isCancel()` guards; call `scaffold()` with resolved options; show `outro` with next steps
- [X] T027 [US1] Build and verify: run `pnpm --filter @gas-plugin/cli build`, then `node packages/cli/dist/index.js create --help` shows correct usage
- [X] T028 [US1] Run all US1 tests: `pnpm --filter @gas-plugin/cli test` — all tests pass

**Checkpoint**: MVP complete. `npx @gas-plugin/cli create` scaffolds a basic GAS project with Vite that builds successfully.

---

## Phase 4: User Story 2 — Choose a Bundler (Priority: P1)

**Goal**: Developer selects from Vite, Rollup, esbuild, or webpack during scaffolding; generated project has correct bundler config.

**Independent Test**: Scaffold with each bundler option, verify each produces the correct config file with the right `@gas-plugin/unplugin/*` import.

### Tests for User Story 2

- [X] T029 [P] [US2] Integration test in `packages/cli/tests/integration/bundlers.test.ts`: for each bundler (vite, rollup, esbuild, webpack), scaffold basic template in temp dir and verify: correct config file exists (vite.config.ts / rollup.config.mjs / esbuild.config.mjs / webpack.config.mjs), config imports from correct `@gas-plugin/unplugin/*` subpath, package.json has correct devDependencies for that bundler, `build` script uses correct command

### Implementation for User Story 2

- [X] T030 [P] [US2] Create Rollup bundler config template in `packages/cli/src/templates/bundler-configs/rollup.config.mjs` with gas-plugin import from `@gas-plugin/unplugin/rollup`, input/output config targeting `dist/`, ES format
- [X] T031 [P] [US2] Create esbuild bundler config template in `packages/cli/src/templates/bundler-configs/esbuild.config.mjs` with gas-plugin import from `@gas-plugin/unplugin/esbuild`, entryPoints, outdir, format settings
- [X] T032 [P] [US2] Create webpack bundler config template in `packages/cli/src/templates/bundler-configs/webpack.config.mjs` with gas-plugin import from `@gas-plugin/unplugin/webpack`, entry, output, module rules for TypeScript
- [X] T033 [US2] Update scaffold pipeline in `packages/cli/src/core/scaffold.ts` to copy the correct bundler config template based on `options.bundler`, substituting bundler-specific placeholders
- [X] T034 [US2] Run all US2 tests: `pnpm --filter @gas-plugin/cli test tests/integration/bundlers.test.ts` — all 4 bundler configs generate correctly

**Checkpoint**: All 4 bundler options produce working configurations. Basic template × 4 bundlers = 4 verified combinations.

---

## Phase 5: User Story 3 — Choose a Project Template (Priority: P2)

**Goal**: Developer selects from basic script, web app, or library template; each generates appropriate source files and GAS configuration.

**Independent Test**: Scaffold each template type, verify source file structure and appsscript.json content match the template type.

### Tests for User Story 3

- [X] T035 [P] [US3] Integration test for webapp template in `packages/cli/tests/integration/create.test.ts` (add test case): scaffold webapp+vite in temp dir, verify `src/index.ts` has `doGet`/`doPost`, `src/client.html` exists, bundler config has `include: ["src/**/*.html"]` and `globals: ["doGet", "doPost"]`, appsscript.json has `script.external_request` scope
- [X] T036 [P] [US3] Integration test for library template in `packages/cli/tests/integration/create.test.ts` (add test case): scaffold library+vite in temp dir, verify `src/index.ts` has exported functions, `src/types.ts` exists, appsscript.json has no scopes, no globals in bundler config

### Implementation for User Story 3

- [X] T037 [P] [US3] Create webapp template files in `packages/cli/src/templates/webapp/`: `src/index.ts` (doGet/doPost handlers), `src/utils.ts` (server-side utilities), `src/client.html` (client-side HTML)
- [X] T038 [P] [US3] Create library template files in `packages/cli/src/templates/library/`: `src/index.ts` (exported library functions), `src/types.ts` (type definitions)
- [X] T039 [US3] Update scaffold pipeline in `packages/cli/src/core/scaffold.ts` to handle template-specific bundler config options: webapp adds `include` and `globals` for doGet/doPost, library has no globals
- [X] T040 [US3] Run all US3 tests — all 3 template types scaffold correctly with correct source files and configuration

**Checkpoint**: 3 templates × 4 bundlers = 12 combinations available. Each template generates appropriate GAS project structure.

---

## Phase 6: User Story 4 — Non-Interactive Mode (Priority: P2)

**Goal**: Developer passes all options as CLI flags; project scaffolds without any prompts.

**Independent Test**: Run `gas-plugin create my-app --template basic --bundler vite --yes` and verify no prompts, correct output.

### Tests for User Story 4

- [X] T041 [P] [US4] Integration test in `packages/cli/tests/integration/non-interactive.test.ts`: test with all flags (`gas-plugin create test-proj --template basic --bundler vite --no-install`), verify project created without prompts; test `--yes` flag uses defaults; test `--force` overwrites non-empty directory; test missing required flags in non-interactive mode shows error; test invalid `--template` or `--bundler` value shows available options and exits with code 2

### Implementation for User Story 4

- [X] T042 [US4] Update `create` command in `packages/cli/src/commands/create.ts`: add citty args for `--template` (enum: basic/webapp/library), `--bundler` (enum: vite/rollup/esbuild/webpack), `--install`/`--no-install` (boolean, default true), `--yes` (boolean), `--force` (boolean); skip prompts when flag value provided; when `--yes`, use defaults for all missing flags
- [X] T043 [US4] Add validation in `packages/cli/src/commands/create.ts`: if target dir non-empty and no `--force`, exit with code 3 and message; if invalid enum value, exit with code 2 and show available options
- [X] T044 [US4] Run all US4 tests — non-interactive mode works correctly with all flag combinations

**Checkpoint**: CLI works fully in both interactive and non-interactive modes. CI/automation ready.

---

## Phase 7: User Story 5 — clasp Integration Setup (Priority: P3)

**Goal**: Developer opts into clasp configuration during scaffolding; `.clasp.json`, `.claspignore`, and deploy scripts are generated.

**Independent Test**: Scaffold with `--clasp`, verify clasp files present. Scaffold without, verify no clasp files.

### Tests for User Story 5

- [X] T045 [P] [US5] Unit test for clasp file generation in `packages/cli/tests/core/scaffold.test.ts` (add test cases): test clasp file content with placeholder Script ID, test clasp file content with provided `--script-id`, test `.claspignore` content, test deploy scripts added to package.json
- [X] T046 [P] [US5] Integration test in `packages/cli/tests/integration/create.test.ts` (add test cases): scaffold with `--clasp`, verify `.clasp.json` and `.claspignore` exist and `package.json` has deploy scripts; scaffold without `--clasp`, verify no clasp files present; scaffold with `--clasp --script-id ABC123`, verify `.clasp.json` has correct ID

### Implementation for User Story 5

- [X] T047 [US5] Update `create` command in `packages/cli/src/commands/create.ts`: add `--clasp` (boolean, default false) and `--script-id` (string, optional) args; add clasp prompt in interactive mode (confirm, default No); validate `--script-id` requires `--clasp`
- [X] T048 [US5] Update scaffold pipeline in `packages/cli/src/core/scaffold.ts`: when `clasp` option enabled, generate `.clasp.json` with `scriptId` (placeholder or provided) and `rootDir: "dist"`, generate `.claspignore` (node_modules, src, *.ts), add `"push": "clasp push"` and `"deploy": "clasp push && clasp deploy"` to package.json scripts
- [X] T049 [US5] Run all US5 tests — clasp opt-in/opt-out works correctly

**Checkpoint**: All 5 user stories complete. Full CLI functionality available.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Coverage, edge cases, build verification, and documentation.

- [X] T050 Run full test suite and verify coverage ≥ 80%: `pnpm --filter @gas-plugin/cli test:coverage` — check lines, branches, functions, statements all ≥ 80% on `src/core/`
- [X] T051 Add missing tests to bring any under-covered modules above 80%: focus on edge cases from spec (special char project names, existing GAS project detection, non-empty target dir warning)
- [X] T052 [P] Add edge case handling: sanitize project name for package.json (npm naming rules), detect existing `appsscript.json` in target dir and warn, handle Ctrl+C cancellation gracefully (exit code 1)
- [X] T053 [P] Implement success message with next steps in `packages/cli/src/commands/create.ts`: after scaffolding, display `cd {{projectName}}`, `{{pm}} install` (if not auto-installed), `{{pm}} run build`, clasp instructions if applicable — using `@clack/prompts` `outro` and `log.step`
- [X] T054 Build full package: `pnpm --filter @gas-plugin/cli build` and verify `dist/index.js` has shebang, `dist/templates/` contains all template files, package exports resolve correctly
- [X] T055 Update root `package.json` scripts if needed: ensure `pnpm -r build` includes CLI package, ensure `pnpm test` includes CLI tests
- [X] T056 Run `pnpm -w run check` (Biome lint/format) on the entire workspace and fix any violations in `packages/cli/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — MVP delivery target
- **US2 (Phase 4)**: Depends on Foundational — can run in parallel with US1 (different files: bundler config templates)
- **US3 (Phase 5)**: Depends on Foundational — can run in parallel with US1/US2 (different files: template source files)
- **US4 (Phase 6)**: Depends on US1 (needs working create command to add flags to)
- **US5 (Phase 7)**: Depends on US1 (needs working scaffold pipeline to add clasp to)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundation only — no other story dependencies. **MVP target.**
- **US2 (P1)**: Foundation only — independent of US1 (adds bundler config templates, doesn't modify create command logic)
- **US3 (P2)**: Foundation only — independent of US1/US2 (adds template source files)
- **US4 (P2)**: Depends on US1 — extends the create command with CLI flags
- **US5 (P3)**: Depends on US1 — extends scaffold pipeline with clasp generation

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Core logic (render, templates, detect) before orchestration (scaffold)
- Scaffold pipeline before CLI command
- Story complete before moving to next priority

### Parallel Opportunities

- T003, T004, T005 (Setup config files) — all parallel
- T008, T009, T010, T011 (Foundation core modules) — all parallel, different files
- T015–T019 (US1 unit tests) — all parallel
- T021–T025 (US1 template files) — all parallel
- T030, T031, T032 (US2 bundler configs) — all parallel
- T035, T036 (US3 integration tests) — parallel
- T037, T038 (US3 template files) — parallel
- US1, US2, US3 can largely proceed in parallel after Foundation (different file sets)

---

## Parallel Example: User Story 1

```bash
# Launch all US1 unit tests together:
Task T015: "Unit test for render engine in packages/cli/tests/core/render.test.ts"
Task T016: "Unit test for template registry in packages/cli/tests/core/templates.test.ts"
Task T017: "Unit test for PM detection in packages/cli/tests/core/detect.test.ts"
Task T018: "Unit test for git init in packages/cli/tests/core/git.test.ts"
Task T019: "Unit test for scaffold pipeline in packages/cli/tests/core/scaffold.test.ts"

# Launch all US1 template files together:
Task T021: "Basic template src/index.ts and src/utils.ts"
Task T022: "Shared template files (tsconfig, biome, gitignore, README)"
Task T023: "Vite bundler config template"
Task T024: "appsscript.json template"
Task T025: "package.json template"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (basic template + Vite)
4. **STOP and VALIDATE**: Scaffold a project, install deps, build — works end-to-end
5. Ship MVP if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (basic + Vite) → Test → **MVP!**
3. US2 (all bundlers) → Test → 4 bundler options available
4. US3 (all templates) → Test → 12 template×bundler combinations
5. US4 (non-interactive) → Test → CI/automation ready
6. US5 (clasp) → Test → Full feature set
7. Polish → Coverage ≥ 80%, edge cases, docs

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (create command + basic template)
   - Developer B: US2 (bundler config templates — independent files)
   - Developer C: US3 (webapp + library templates — independent files)
3. US4 and US5 extend US1 — start after US1 complete

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Coverage gate**: Implementation is not complete until overall coverage ≥ 80%. Phase 8 must verify and remediate coverage gaps before marking the feature done.
- **Template files use `_` prefix for dotfiles**: `_gitignore` → `.gitignore` (npm strips dotfiles from packages)
- **citty gotcha**: Define `project-name` as positional arg on `create` subcommand only, not on main command (avoids routing conflict per citty #133)
