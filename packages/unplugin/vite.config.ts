import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [dts({ rollupTypes: true })],
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        vite: "src/vite.ts",
        rollup: "src/rollup.ts",
        webpack: "src/webpack.ts",
        rolldown: "src/rolldown.ts",
        esbuild: "src/esbuild.ts",
        bun: "src/bun.ts",
      },
      formats: ["es"],
    },
    rolldownOptions: {
      external: [
        "unplugin",
        "vite",
        "rollup",
        "rolldown",
        "webpack",
        "esbuild",
        "node:fs",
        "node:path",
        "node:fs/promises",
        "tinyglobby",
      ],
      output: {
        exports: "named",
      },
    },
    minify: false,
  },
});
