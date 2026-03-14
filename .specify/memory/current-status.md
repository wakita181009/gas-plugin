# Current Status

## In Progress

<!-- Nothing currently in progress -->

## Known Gaps

- `apps/gas-webapp` has not been tested with a real `clasp push` deployment (requires GAS project credentials).
- `index.ts` plugin hooks are covered via integration tests; branch coverage is 77.64% due to webpack `afterEmit` callback and esbuild `outfile` paths not being exercised in integration tests. Core modules are at 100%.
- IIFE-wrapped output detection/unwrap is deferred to a future version per spec clarification.
- webpack integration test not yet implemented (webpack is listed as P2 in spec).
- Bun integration test not yet implemented (Bun is listed as P2 in spec).
- Unmatched globals warning is implemented but not covered by a dedicated test (verified via integration behavior).
- `@gas-plugin/cli`: `npm create @gas-plugin` shorthand deferred (requires `@gas-plugin/create` wrapper package).
- `@gas-plugin/cli`: Root `pnpm test` script does not yet include CLI tests (only runs gas-vite-plugin). CLI tests must be run separately via `pnpm --filter @gas-plugin/cli test`.
- `@gas-plugin/cli`: Project name sanitization for npm naming rules not yet implemented (FR edge case).
- `@gas-plugin/cli`: Existing `appsscript.json` detection/warning in target directory not yet implemented (FR edge case).

## Deferred Work

- npm publication artifacts are ready but `npm publish` has not been executed for `@gas-plugin/unplugin`.
- `gas-vite-plugin` npm unpublish pending per spec FR-012.
- IIFE detection/unwrap — deferred per v0.2 spec edge case decision.
- Deno support (US6, P3) — covered via esbuild compatibility, no dedicated adapter.
- `@gas-plugin/create` wrapper package for `npm create @gas-plugin` shorthand — deferred per spec FR-010/FR-014.
- `@gas-plugin/cli` `dev` (watch/rebuild) script generation — deferred per spec FR-008 clarification.
- `@gas-plugin/cli` npm publication — package is ready but `npm publish` not yet executed.

## Completed

- v0.1 (spec `001-gas-vite-plugin-v01`): Export stripping, manifest copy, build defaults — all implemented and tested.
- v0.2 (spec `002-gas-vite-plugin-v02`): Include copy, globals/autoGlobals protection, export edge cases, web app test app — all implemented and tested.
- v0.0.5 (spec `003-unplugin-migration`): Universal bundler plugin via unplugin v3. Core features (export stripping, manifest copy, include copy, globals protection, build defaults) ported to multi-bundler architecture. Vite 5–8+ compatibility. Unmatched globals warning added. Integration tests for Vite, Rollup, esbuild. Subpath exports for all 5 bundlers. Coverage: core 100%, overall 80%+.
- v0.1.0 (spec `004-gas-cli`): `@gas-plugin/cli` with `create` subcommand. 3 templates (basic, webapp, library) × 4 bundlers (vite, rollup, esbuild, webpack). Interactive + non-interactive modes. clasp integration opt-in. Package manager auto-detection. 50 tests passing, 94%+ coverage on core modules. All 56 tasks completed.
