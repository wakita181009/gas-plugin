# @gas-plugin

Tooling for Google Apps Script projects — scaffold a new project in seconds and build with any bundler.

## Quick Start

```bash
# Scaffold a new project
npx @gas-plugin/cli create

# Or install the bundler plugin directly
npm install -D @gas-plugin/unplugin
```

```typescript
// vite.config.ts
import gasPlugin from "@gas-plugin/unplugin/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [gasPlugin()],
  build: {
    lib: {
      entry: "src/main.ts",
      formats: ["es"],
      fileName: () => "Code.js",
    },
  },
});
```

```bash
npx vite build
npx clasp push
```

## Packages

| Package | Description |
|---------|-------------|
| [`@gas-plugin/unplugin`](./packages/unplugin/) | Universal bundler plugin (Vite, Rollup, webpack, esbuild, Bun) |
| [`@gas-plugin/cli`](./packages/cli/) | Scaffolding CLI (`npx @gas-plugin/cli create`) |
| [`gas-vite-plugin`](./packages/gas-vite-plugin/) | Legacy Vite-only plugin (deprecated) |

## Example Apps

| App | Description |
|-----|-------------|
| [`gas-script`](./apps/gas-script/) | Basic GAS project (triggers, menus) |
| [`gas-webapp`](./apps/gas-webapp/) | GAS web app (doGet + HTML + google.script.run) |

## Development

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm test:e2e         # Run E2E tests
pnpm -w run check     # Lint & format with Biome
```

## License

MIT
