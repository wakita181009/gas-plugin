import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [dts({ rollupTypes: true, tsconfigPath: "./tsconfig.json" })],
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        "commands/create": "src/commands/create.ts",
      },
      formats: ["es"],
    },
    rolldownOptions: {
      external: ["citty", "@clack/prompts", /^node:/],
      output: {
        exports: "named",
        banner: (chunk) => {
          if (chunk.fileName === "index.js") {
            return "#!/usr/bin/env node";
          }
          return "";
        },
      },
    },
    minify: false,
  },
});
