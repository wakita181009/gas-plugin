import { type StripExportsOptions, stripExports } from "./transforms.js";

export type PostProcessOptions = StripExportsOptions;

/**
 * Post-process a bundled code string:
 * 1. Strip export keywords and blocks, remove tree-shake protection injections,
 *    and optionally downlevel BigInt literals (default: true) in a single AST traversal pass
 * 2. Normalize trailing newline
 */
export function postProcessBundle(code: string, options: PostProcessOptions = {}): string {
  const result = stripExports(code, options);
  return `${result.trimEnd()}\n`;
}
