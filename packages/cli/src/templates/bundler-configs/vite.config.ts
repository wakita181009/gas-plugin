import { defineConfig } from "vite";
import gasPlugin from "{{bundlerImport}}";

export default defineConfig({
  plugins: [
    gasPlugin({
{{includeHtml}}
{{globalsConfig}}
{{autoGlobals}}
    }),
  ],
  build: {
    outDir: "dist",
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
    },
  },
});
