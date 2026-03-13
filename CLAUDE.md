# gas-vite-plugin Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-13

## Active Technologies

- TypeScript 5.x (compiled via Vite/esbuild) + vite >=5.0.0 (peer dependency only) (001-gas-vite-plugin-v01)

## Project Structure

```text
packages/
  gas-vite-plugin/    # The Vite plugin (published to npm)
    src/              # Source code (index.ts, transforms.ts)
    tests/            # Unit + integration tests
```

## Commands

```bash
pnpm test             # Run tests
pnpm check            # Lint & format with Biome
pnpm build            # Build all packages
```

## Code Style

TypeScript 5.x (compiled via Vite/esbuild): Follow standard conventions. See `biome.json` for lint/format rules.

## Design Principles & Architecture

See [`.specify/memory/constitution.md`](.specify/memory/constitution.md) for design principles, architecture constraints, and governance.

## Recent Changes

- 001-gas-vite-plugin-v01: Added TypeScript 5.x (compiled via Vite/esbuild) + vite >=5.0.0 (peer dependency only)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
