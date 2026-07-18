import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { resolveCatalog } from "../packages/cli/build/resolve-catalog.js";

const workspaceFile = fileURLToPath(new URL("../pnpm-workspace.yaml", import.meta.url));

export default defineConfig({
  plugins: [resolveCatalog(workspaceFile)],
  test: {
    include: ["**/*.test.ts"],
    testTimeout: 120_000,
  },
});
