import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
//#region src/transforms.ts
/**
* Strip `export` keyword from inline declarations.
*
* Handles patterns like:
*   export function foo() { ... }
*   export async function bar() { ... }
*   export const x = ...
*   export let y = ...
*   export var z = ...
*
* These become bare top-level declarations that GAS can call.
*/
function stripExportKeywords(code) {
	let result = code;
	result = result.replace(/^export\s+(function\s)/gm, "$1");
	result = result.replace(/^export\s+(async\s+function\s)/gm, "$1");
	result = result.replace(/^export\s+(const\s)/gm, "$1");
	result = result.replace(/^export\s+(let\s)/gm, "$1");
	result = result.replace(/^export\s+(var\s)/gm, "$1");
	return result;
}
/**
* Remove remaining export blocks from bundled output:
*   - `export { foo, bar };`
*   - `export default expression;`
*
* Vite library mode typically generates `export { ... }` blocks
* at the end of the output after all declarations.
*/
function removeExportBlocks(code) {
	let result = code;
	result = result.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, "");
	result = result.replace(/^export\s+default\s+/gm, "");
	return result;
}
//#endregion
//#region src/index.ts
function gasPlugin(options = {}) {
	const { manifest = "src/appsscript.json" } = options;
	let rootDir = process.cwd();
	let outDir = "dist";
	return {
		name: "gas-vite-plugin",
		enforce: "post",
		apply: "build",
		config(config) {
			return { build: {
				minify: false,
				rollupOptions: {
					...config.build?.rollupOptions,
					output: {
						...config.build?.rollupOptions?.output,
						codeSplitting: config.build?.lib || Array.isArray(config.build?.rollupOptions?.input) ? void 0 : false
					}
				}
			} };
		},
		configResolved(config) {
			rootDir = config.root;
			outDir = config.build.outDir;
		},
		generateBundle(_, bundle) {
			for (const chunk of Object.values(bundle)) {
				if (chunk.type !== "chunk") continue;
				let code = chunk.code;
				code = stripExportKeywords(code);
				code = removeExportBlocks(code);
				chunk.code = `${code.trimEnd()}\n`;
			}
		},
		closeBundle() {
			const src = resolve(rootDir, manifest);
			const dest = resolve(rootDir, outDir, "appsscript.json");
			if (existsSync(src)) copyFileSync(src, dest);
			else console.warn(`[gas-vite-plugin] manifest not found: ${manifest}. Skipping copy.`);
		}
	};
}
//#endregion
export { gasPlugin as default, gasPlugin, removeExportBlocks, stripExportKeywords };
