import gasPlugin from "{{bundlerImport}}";

const result = await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  plugins: [
    gasPlugin({
{{includeHtml}}
{{globalsConfig}}
{{autoGlobals}}
    }),
  ],
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}
