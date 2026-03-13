# Feature Specification: gas-vite-plugin v0.1 (Script Focus)

**Feature Branch**: `001-gas-vite-plugin-v01`
**Created**: 2026-03-13
**Status**: Draft
**Input**: Minimal Vite plugin for Google Apps Script — V8-first, zero-dependency, export-first DX. Script projects only.

## Assumptions & Constraints

- **GAS V8 runtime only**: The Rhino runtime was sunset on 2026-01-31. All GAS projects now run on V8. This plugin targets V8 exclusively and performs no legacy syntax transformations.
- **GAS does not support ES Modules**: Despite running V8 (which supports ES2017+), GAS does not support `import`/`export` syntax. This is the fundamental reason the plugin must remove all export statements from the bundled output.
- **`appsscript.json` must specify `"runtimeVersion": "V8"`**: The manifest file in every GAS project must declare V8 runtime.
- **GAS requires flat file structure**: All files must be at the top level of the project (no subdirectories).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic GAS project build (Priority: P1)

A developer writes standard TypeScript with `export function` and runs a build command. The output is a single `.js` file where all exported functions are top-level declarations that GAS can call (triggers, `google.script.run`, menu handlers). The developer does not need to learn any special syntax or conventions — they just write normal TypeScript exports.

**Why this priority**: This is the core value proposition. Without this, the plugin has no reason to exist. It's the minimum viable product.

**Independent Test**: Create a TypeScript file with `export function onOpen()` and `export function myHandler()`, build, verify the output has top-level `function onOpen()` and `function myHandler()` without any `export` keywords.

**Acceptance Scenarios**:

1. **Given** a TS file with `export function onOpen() { ... }`, **When** the project is built, **Then** output contains `function onOpen() { ... }` at top level (no `export` keyword)
2. **Given** a TS file with `export async function doPost(e) { ... }`, **When** the project is built, **Then** output contains `async function doPost(e) { ... }` at top level
3. **Given** a TS file with `export const processData = () => { ... }`, **When** the project is built, **Then** output contains `const processData = ...` at top level (no `export`)
4. **Given** a TS file importing from other local modules, **When** the project is built, **Then** all code is bundled into a single file with no `import`/`export` statements

---

### User Story 2 - appsscript.json manifest handling (Priority: P1)

The `appsscript.json` manifest is automatically copied to the output directory alongside the bundled code, so `clasp push` can deploy both files together. The developer does not need to set up any copy steps manually.

**Why this priority**: Without the manifest, `clasp push` cannot deploy. This is a hard requirement for any GAS project.

**Independent Test**: Place `appsscript.json` in the source directory, build, verify the output directory contains an identical copy.

**Acceptance Scenarios**:

1. **Given** `appsscript.json` exists at the default location, **When** the project is built, **Then** the output directory contains an exact copy
2. **Given** the manifest path is customized via configuration, **When** the project is built, **Then** the file at the custom path is copied to the output directory
3. **Given** no `appsscript.json` exists at the configured path, **When** the project is built, **Then** a warning is shown but the build does not fail

---

### User Story 3 - Zero-config build defaults (Priority: P1)

The plugin automatically applies GAS-compatible build settings so the developer doesn't need to configure them manually. The output is human-readable (not minified) and contained in a single file (no code splitting).

**Why this priority**: Misconfigured builds (minified, code-split) silently produce broken GAS output. Preventing this by default is essential for a "just works" experience.

**Independent Test**: Use the plugin with no options, build, verify output is not minified and all code is in a single file.

**Acceptance Scenarios**:

1. **Given** the plugin is added with default options, **When** the project is built, **Then** the output is not minified
2. **Given** the plugin is added with default options, **When** the project is built with dynamic imports, **Then** all code is inlined into a single file (no code splitting)
3. **Given** the developer explicitly overrides a build default, **When** the project is built, **Then** the developer's explicit choice takes precedence over the plugin's default

---

### User Story 4 - Test app: GAS script (Priority: P1)

A standalone test app (`apps/gas-script`) that exercises typical GAS script patterns: spreadsheet triggers (`onOpen`, `onEdit`), custom menus, utility functions across multiple modules. This serves as both a validation tool and a usage example.

**Why this priority**: Validates the core use case before publishing. No release without a working test app.

**Independent Test**: Build the app, push via `clasp push`, verify all triggers and menu handlers work in Google Sheets.

**Acceptance Scenarios**:

1. **Given** a multi-module script project with `onOpen`, `onEdit`, and custom menu handlers, **When** built, **Then** all functions are top-level in a single output file
2. **Given** the script imports utility functions from separate modules, **When** built, **Then** everything is bundled into one file with no `import`/`export` statements
3. **Given** the built output, **When** pushed via `clasp push` and opened in Sheets, **Then** the custom menu appears and all handlers execute correctly
4. **Given** the test app's `appsscript.json`, **Then** it declares `"runtimeVersion": "V8"`

---

### User Story 5 - npm package publication (Priority: P2)

The plugin is published to npm as a package with TypeScript type definitions, so users can install and use it with a single `npm install` command.

**Why this priority**: Required for adoption but can be done after all functionality is verified.

**Independent Test**: Pack the package, inspect the contents, verify all expected artifacts are present.

**Acceptance Scenarios**:

1. **Given** the plugin is built, **Then** both ESM and CJS entry points and type definitions are generated
2. **Given** a user installs the package, **Then** ESM import syntax works
3. **Given** a user installs the package, **Then** CJS require syntax works
4. **Given** the published package, **Then** it declares a peer dependency on the build tool (not bundled)

---

### Edge Cases

- What happens when the bundle contains no exports? → Plugin passes through code unchanged
- What happens when multiple output files are generated (despite single-file defaults)? → Each file is processed independently
- What happens with `export * from './module'`? → The bundler resolves this before the plugin processes the output; only the resolved result is seen
- What happens with circular imports between modules? → The bundler handles resolution; the plugin processes the final flat output
- What happens with `export type { Foo }`? → TypeScript types are erased during compilation before reaching the plugin; no action needed
- What happens when the developer already set a build default that matches the plugin's default? → No conflict; settings merge cleanly
- What happens with bundler-generated region comments? → Preserve them (they are informational and harmless)
- What happens with IIFE-wrapped output? → Plugin should detect and handle if output is wrapped in a module pattern (GAS needs bare top-level functions)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Plugin MUST remove `export` keywords from `export function` and `export async function` declarations in the output
- **FR-002**: Plugin MUST remove `export` keywords from `export const`, `export let`, and `export var` declarations in the output
- **FR-003**: Plugin MUST remove `export { ... }` aggregation blocks generated by the bundler's library mode
- **FR-004**: Plugin MUST copy `appsscript.json` to the output directory
- **FR-005**: Plugin MUST disable minification by default
- **FR-006**: Plugin MUST prevent code splitting by default (all code in a single output file)
- **FR-007**: Plugin MUST NOT perform arrow function → function declaration conversion (V8 runtime handles modern JS)
- **FR-008**: Plugin MUST NOT perform `console.log` → `Logger.log` conversion
- **FR-009**: Plugin MUST inject zero code into the user's GAS output (no runtime footprint)
- **FR-010**: Plugin MUST process code after all other build plugins have finished
- **FR-011**: Plugin MUST only run during build, not during development server mode
- **FR-012**: Plugin MUST preserve async function declarations without modification
- **FR-013**: Plugin MUST warn (not fail) when `appsscript.json` is not found at the configured path
- **FR-014**: Plugin MUST produce output where all GAS-callable functions are bare top-level declarations (not wrapped in modules or closures)
- **FR-015**: Plugin MUST be compatible with the build tool versions 5 through 8+
- **FR-016**: Plugin MUST be publishable as a dual ESM/CJS package with TypeScript type definitions

### Key Entities

- **Plugin Configuration**: The settings object a developer passes when adding the plugin, controlling manifest path
- **Output Chunk**: A single unit of bundled output code that the plugin processes to remove export syntax and ensure top-level declarations

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of exported functions in a GAS project become top-level declarations in the output (zero remaining `export` keywords)
- **SC-002**: `appsscript.json` is present in the output directory after every successful build
- **SC-003**: Output is deployable via `clasp push` without any manual post-processing steps
- **SC-004**: Plugin adds zero runtime dependencies to the user's project
- **SC-005**: Test app (`apps/gas-script`) builds and deploys correctly
- **SC-006**: All transform functions have 100% unit test coverage
- **SC-007**: Package works in both ESM and CJS environments without configuration
- **SC-008**: A new GAS project can be configured to use the plugin in 3 lines or fewer
