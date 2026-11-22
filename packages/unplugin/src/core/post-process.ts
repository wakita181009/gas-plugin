import { stripExports } from "./transforms.js";

/**
 * Post-process a bundled code string:
 * 1. Strip export keywords and blocks, and remove tree-shake protection injections in a single AST traversal pass
 * 2. Normalize trailing newline
 */
export function postProcessBundle(code: string): string {
  const result = stripExports(code);
  return `${result.trimEnd()}\n`;
}
