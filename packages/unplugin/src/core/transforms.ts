import MagicString from "magic-string";
import { parseSync, type Statement } from "oxc-parser";

const DEFAULT_EXPORT_BINDING = "__gas_default__";

/**
 * Strip `export` keyword from inline declarations using AST parsing.
 *
 * Handles patterns like:
 *   export function foo() { ... }
 *   export async function bar() { ... }
 *   export const x = ...
 *   export let y = ...
 *   export var z = ...
 *   export class Foo { ... }
 *   export abstract class Bar { ... }
 *
 * These become bare top-level declarations that GAS can call.
 */
export function stripExportKeywords(code: string): string {
  if (!code.includes("export")) return code;

  const result = parseSync("bundle.ts", code);
  if (!result.program || result.program.body.length === 0) {
    return code;
  }

  const s = new MagicString(code);
  let changed = false;

  for (const node of result.program.body) {
    if (node.type === "ExportNamedDeclaration" && node.declaration) {
      // Preserve contract: only strip if export keyword starts at the beginning of a line
      const prevChar = node.start > 0 ? code[node.start - 1] : "\n";
      if (node.start !== 0 && prevChar !== "\n" && prevChar !== "\r") {
        continue;
      }

      const decl = node.declaration;
      s.remove(node.start, decl.start);
      changed = true;
    }
  }

  return changed ? s.toString() : code;
}

function transformDefaultExport(node: Statement, s: MagicString): void {
  if (node.type !== "ExportDefaultDeclaration") return;
  const decl = node.declaration;

  const isNamedDecl =
    (decl.type === "FunctionDeclaration" || decl.type === "ClassDeclaration") &&
    "id" in decl &&
    Boolean(decl.id);

  if (isNamedDecl) {
    s.remove(node.start, decl.start);
  } else {
    s.overwrite(node.start, decl.start, `const ${DEFAULT_EXPORT_BINDING} = `);
  }
}

function transformExportBlockNode(node: Statement, code: string, s: MagicString): boolean {
  if (node.type === "ExportNamedDeclaration" && !node.declaration) {
    let end = node.end;
    if (code[end] === "\n") end += 1;
    s.remove(node.start, end);
    return true;
  }

  if (node.type === "ExportDefaultDeclaration") {
    transformDefaultExport(node, s);
    return true;
  }

  if (node.type === "ExportAllDeclaration") {
    let end = node.end;
    if (code[end] === "\n") end += 1;
    s.remove(node.start, end);
    return true;
  }

  return false;
}

/**
 * Remove remaining export blocks and transform default exports from bundled output:
 *   - `export { foo, bar };` -> removed
 *   - `export default function foo() {}` -> `function foo() {}`
 *   - `export default class Foo {}` -> `class Foo {}`
 *   - `export default expression;` -> `const __gas_default__ = expression;`
 */
export function removeExportBlocks(code: string): string {
  if (!code.includes("export")) return code;

  const result = parseSync("bundle.ts", code);
  if (!result.program || result.program.body.length === 0) {
    return code;
  }

  const s = new MagicString(code);
  let changed = false;

  for (const node of result.program.body) {
    if (transformExportBlockNode(node, code, s)) {
      changed = true;
    }
  }

  return changed ? s.toString() : code;
}

function transformExportNamed(
  node: Extract<Statement, { type: "ExportNamedDeclaration" }>,
  code: string,
  s: MagicString,
): boolean {
  if (node.declaration) {
    const prevChar = node.start > 0 ? code[node.start - 1] : "\n";
    if (node.start !== 0 && prevChar !== "\n" && prevChar !== "\r") {
      return false;
    }
    s.remove(node.start, node.declaration.start);
    return true;
  }
  let end = node.end;
  if (code[end] === "\n") end += 1;
  s.remove(node.start, end);
  return true;
}

function transformExportNode(node: Statement, code: string, s: MagicString): boolean {
  if (node.type === "ExportNamedDeclaration") {
    return transformExportNamed(node, code, s);
  }
  if (node.type === "ExportDefaultDeclaration") {
    transformDefaultExport(node, s);
    return true;
  }
  if (node.type === "ExportAllDeclaration") {
    let end = node.end;
    if (code[end] === "\n") end += 1;
    s.remove(node.start, end);
    return true;
  }
  return false;
}

function isKeepStatement(node: Statement): boolean {
  if (node.type !== "ExpressionStatement") return false;
  const expr = node.expression;
  if (expr.type !== "AssignmentExpression") return false;
  const left = expr.left;
  if (left.type === "MemberExpression") {
    return (
      (left.property.type === "Identifier" && left.property.name === "__gas_keep__") ||
      (left.property.type === "Literal" &&
        (left.property as { value?: unknown }).value === "__gas_keep__")
    );
  }
  if (left.type === "Identifier") {
    return left.name === "__gas_keep__";
  }
  return false;
}

function removeStatementLine(node: Statement, code: string, s: MagicString): void {
  let start = node.start;
  while (start > 0 && code[start - 1] !== "\n" && code[start - 1] !== "\r") {
    start--;
  }
  let end = node.end;
  if (code[end] === "\r" && code[end + 1] === "\n") {
    end += 2;
  } else if (code[end] === "\n") {
    end += 1;
  }
  s.remove(start, end);
}

/**
 * Strip both inline export keywords, export blocks, and tree-shake protection markers
 * in a single AST traversal pass.
 */
export function stripExports(code: string): string {
  if (!(code.includes("export") || code.includes("__gas_keep__"))) {
    return code;
  }

  const result = parseSync("bundle.ts", code);
  if (!result.program || result.program.body.length === 0) {
    return code;
  }

  const s = new MagicString(code);
  let changed = false;

  for (const node of result.program.body) {
    if (transformExportNode(node, code, s)) {
      changed = true;
    } else if (isKeepStatement(node)) {
      removeStatementLine(node, code, s);
      changed = true;
    }
  }

  return changed ? s.toString() : code;
}
