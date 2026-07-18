import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { resolveCatalog } from "./build/resolve-catalog.js";

const workspaceFile = fileURLToPath(new URL("../../pnpm-workspace.yaml", import.meta.url));

export default defineConfig({
  plugins: [resolveCatalog(workspaceFile)],
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/core/render.ts",
        "src/core/templates.ts",
        "src/core/detect.ts",
        "src/core/git.ts",
        "src/core/scaffold.ts",
        "src/core/validate.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
