# Feature Catalog

## Entities / Topics

| Entity/Topic | Overview Doc | Description |
|-------------|-------------|-------------|
| gas-vite-plugin | `.specify/features/gas-vite-plugin/overview.md` | Vite plugin that transforms ES module output into GAS-compatible flat files |

## Use Cases

| Entity/Topic | Use Case | Doc Path | Type |
|-------------|----------|----------|------|
| gas-vite-plugin | Export Stripping | `.specify/features/gas-vite-plugin/export-stripping.md` | command |
| gas-vite-plugin | Manifest Copy | `.specify/features/gas-vite-plugin/manifest-copy.md` | command |
| gas-vite-plugin | Build Defaults | `.specify/features/gas-vite-plugin/build-defaults.md` | command |

## Reverse Lookup — by Endpoint

| Endpoint | Use Case Doc |
|----------|-------------|
| `stripExportKeywords()` | `.specify/features/gas-vite-plugin/export-stripping.md` |
| `removeExportBlocks()` | `.specify/features/gas-vite-plugin/export-stripping.md` |
| `gasPlugin()` | `.specify/features/gas-vite-plugin/overview.md` |
| Vite `config()` hook | `.specify/features/gas-vite-plugin/build-defaults.md` |
| Vite `generateBundle()` hook | `.specify/features/gas-vite-plugin/export-stripping.md` |
| Vite `closeBundle()` hook | `.specify/features/gas-vite-plugin/manifest-copy.md` |

## Reverse Lookup — by File

| File Path | Related Docs |
|-----------|-------------|
| `packages/gas-vite-plugin/src/index.ts` | overview, export-stripping, manifest-copy, build-defaults |
| `packages/gas-vite-plugin/src/transforms.ts` | export-stripping |
| `packages/gas-vite-plugin/tests/unit/transforms.test.ts` | export-stripping |
| `packages/gas-vite-plugin/tests/integration/build.test.ts` | export-stripping, manifest-copy, build-defaults |

## Reverse Lookup — by Search Tag

| Tag | Related Docs |
|-----|-------------|
| GAS | overview, export-stripping, manifest-copy, build-defaults |
| export removal | export-stripping |
| appsscript.json | manifest-copy |
| minify | build-defaults |
| code splitting | build-defaults |
| clasp push | manifest-copy |
| Vite plugin | overview |

## Spec Traceability

| Spec | Feature Docs |
|------|-------------|
| `.specify/specs/001-gas-vite-plugin-v01/spec.md` | overview, export-stripping (US1, FR-001–003), manifest-copy (US2, FR-004/013), build-defaults (US3, FR-005/006) |
