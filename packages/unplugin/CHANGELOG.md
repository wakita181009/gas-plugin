# Changelog

## [0.2.1](https://github.com/wakita181009/gas-plugin/compare/unplugin-v0.2.0...unplugin-v0.2.1) (2026-07-18)


### Bug Fixes

* **tsconfig:** add explicit node types to fix dts build warnings ([#63](https://github.com/wakita181009/gas-plugin/issues/63)) ([773f054](https://github.com/wakita181009/gas-plugin/commit/773f0548695c615339c6184ca2a6d28bc8e20ce1))

## [0.2.0](https://github.com/wakita181009/gas-plugin/compare/unplugin-v0.1.3...unplugin-v0.2.0) (2026-07-19)


### ⚠ BREAKING CHANGES

* Node.js &gt;= 22 is now required (previously &gt;= 20)


### Miscellaneous Chores

* require Node 22+ and update CI matrix to [22, 24, 26] ([4345998](https://github.com/wakita181009/gas-plugin/commit/43459981d43481f94ad9f0f03fc552658a8d7b84))
* adopt pnpm catalog for shared dependencies ([#51](https://github.com/wakita181009/gas-plugin/issues/51)) ([b93258a](https://github.com/wakita181009/gas-plugin/commit/b93258a574a064a6bc5db9ef47d6ed5b68560a8e))
* upgrade dev tooling and stabilize typescript resolution ([d43d6b0](https://github.com/wakita181009/gas-plugin/commit/d43d6b08caae82dbf7e3cbf44d450310e626f7f8))


### Dependencies

* bump unplugin from 3.0.0 to 3.3.0 ([#45](https://github.com/wakita181009/gas-plugin/issues/45)) ([f1cf23a](https://github.com/wakita181009/gas-plugin/commit/f1cf23a6b5eaa1361e204ec3c98cfa766ac40b0f))
* bump tinyglobby from 0.2.15 to 0.2.17 ([#38](https://github.com/wakita181009/gas-plugin/issues/38)) ([1b4c390](https://github.com/wakita181009/gas-plugin/commit/1b4c390bf2ceac6333dc685a92043b583e46f19d))

## [0.1.3](https://github.com/wakita181009/gas-plugin/compare/unplugin-v0.1.2...unplugin-v0.1.3) (2026-03-17)


### Bug Fixes

* **ci:** use GH_PAT for release-please to enable workflow triggers ([733cae2](https://github.com/wakita181009/gas-plugin/commit/733cae2a36a49080a2fd85dc27b68602387ecb5b))

## [0.1.2](https://github.com/wakita181009/gas-plugin/compare/unplugin-v0.1.1...unplugin-v0.1.2) (2026-03-17)


### Bug Fixes

* add engines field requiring Node.js &gt;=20 ([#10](https://github.com/wakita181009/gas-plugin/issues/10)) ([afd0af9](https://github.com/wakita181009/gas-plugin/commit/afd0af97ada2dda715955ef3eaed337d21744531))

## [0.1.0](https://github.com/wakita181009/gas-plugin/compare/unplugin-v0.0.13...unplugin-v0.1.0) (2026-03-17)


### Features

* add E2E tests and fix scaffold dependency issues ([60d488f](https://github.com/wakita181009/gas-plugin/commit/60d488f25827bae6f6b3a311d47ceee71a840b03))
* **unplugin:** add Rolldown support & introduce release-please ([#6](https://github.com/wakita181009/gas-plugin/issues/6)) ([124fb4f](https://github.com/wakita181009/gas-plugin/commit/124fb4f3f1f9b08fc732b6261f7c739a592baf48))
