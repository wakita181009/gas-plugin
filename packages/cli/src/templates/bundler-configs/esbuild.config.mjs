import { build } from "esbuild";
import gasPlugin from "{{bundlerImport}}";

await build({
  entryPoints: ["src/index.ts"],
  outdir: "dist",
  format: "esm",
  bundle: true,
  plugins: [
    gasPlugin({
{{includeHtml}}
{{globalsConfig}}
{{autoGlobals}}
    }),
  ],
});
