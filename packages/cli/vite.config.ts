import { cpSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import dts from "vite-plugin-dts";
import { resolveCatalog } from "./build/resolve-catalog.js";

const workspaceFile = fileURLToPath(new URL("../../pnpm-workspace.yaml", import.meta.url));

function copyTemplates(): Plugin {
  return {
    name: "copy-templates",
    closeBundle() {
      cpSync("src/templates", "dist/templates", { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [
    resolveCatalog(workspaceFile),
    dts({ rollupTypes: true, tsconfigPath: "./tsconfig.json" }),
    copyTemplates(),
  ],
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
