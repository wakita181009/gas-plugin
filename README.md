# @gas-plugin/unplugin

A universal bundler plugin for Google Apps Script projects.

Write standard TypeScript with `export function` — the plugin strips exports, copies manifests, and protects functions from tree-shaking so your code runs on GAS as-is. Works with **Vite**, **Rollup**, **webpack**, **esbuild**, and **Bun**.

## Quick Start

```bash
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

See [`packages/unplugin/README.md`](./packages/unplugin/README.md) for full documentation, all bundler examples, and options.

## Packages

| Package | Description |
|---------|-------------|
| [`@gas-plugin/unplugin`](./packages/unplugin/) | Universal bundler plugin (Vite, Rollup, webpack, esbuild, Bun) |
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
pnpm -w run check     # Lint & format with Biome
```

## License

MIT
