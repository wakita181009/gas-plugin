# @gas-plugin

A monorepo for Google Apps Script (GAS) bundler tooling.

- **@gas-plugin/unplugin** — Universal bundler plugin (Vite, Rollup, webpack, esbuild, Bun) via [unplugin](https://github.com/unjs/unplugin)
- **@gas-plugin/cli** — Scaffolding CLI (`npx @gas-plugin/cli create`)

## Design Principles & Architecture

See [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) for design principles, architecture constraints, and governance.

## Project Structure

```text
packages/
  unplugin/             # @gas-plugin/unplugin (published to npm)
    src/
      index.ts          # unplugin factory + bundler-specific hooks
      vite.ts           # Vite entry point
      rollup.ts         # Rollup entry point
      webpack.ts        # webpack entry point
      esbuild.ts        # esbuild entry point
      bun.ts            # Bun entry point
      core/
        transforms.ts   # Pure string transforms (export stripping)
        post-process.ts # Bundle post-processing pipeline
        include.ts      # Glob resolution + flat file copy
        globals.ts      # Tree-shake protection detection
        types.ts        # GasPluginOptions interface
        utils.ts        # Shared utilities (input extraction, root detection)
    tests/
      core/             # Unit tests for each core module
      exports.test.ts   # Package export validation
      integration/      # Vite, Rollup, esbuild integration tests
  cli/                  # @gas-plugin/cli (published to npm)
    src/
      index.ts          # citty CLI entrypoint
      commands/
        create.ts       # create subcommand (interactive + non-interactive)
      core/
        scaffold.ts     # Scaffolding pipeline orchestrator
        render.ts       # {{placeholder}} template engine
        templates.ts    # Template/bundler registries
        detect.ts       # Package manager detection
        git.ts          # Git initialization
        types.ts        # Type definitions
      templates/        # Project templates (basic, webapp, bundler-configs, shared)
    tests/
      core/             # Unit tests
      integration/      # E2E scaffold tests
  gas-vite-plugin/      # Legacy Vite-only plugin (deprecated)
apps/
  gas-script/           # Test app: basic GAS project
  gas-webapp/           # Test app: GAS web app (doGet + HTML)
e2e/                    # End-to-end tests (120s timeout)
```

## Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm test:e2e         # Run E2E tests
pnpm -w run check     # Lint & format check with Biome
```

## Versioning

`@gas-plugin/unplugin` and `@gas-plugin/cli` share the same version. To bump:

```bash
pnpm -r exec -- npm version <ver> --no-git-tag-version
```

## Code Style

TypeScript 5.x (compiled via Vite/oxc): Follow standard conventions. See `biome.json` for lint/format rules.

## Active Technologies

- TypeScript 5.x, ES2022 target, Node.js 20+
- `unplugin` (universal bundler plugin framework), `tinyglobby` (glob resolution)
- `citty` (CLI framework, subcommand routing), `@clack/prompts` (interactive prompts)
