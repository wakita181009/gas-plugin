import { parseSync, Visitor, type VisitorObject } from "oxc-parser";

export interface GasSyntaxIssue {
  line: number;
  column: number;
  reason: string;
}

const LOGICAL_ASSIGNMENT_OPERATORS = new Set(["??=", "||=", "&&="]);

function computeLineColumn(code: string, offset: number): { line: number; column: number } {
  const clamped = Math.max(0, Math.min(offset, code.length));
  let line = 1;
  let lastNewline = -1;

  for (let i = 0; i < clamped; i += 1) {
    if (code.charCodeAt(i) === 10) {
      line += 1;
      lastNewline = i;
    }
  }

  return { line, column: clamped - lastNewline };
}

type LiteralNode = Parameters<NonNullable<VisitorObject["Literal"]>>[0];

function getLiteralIssueReason(node: LiteralNode): string | undefined {
  if ("bigint" in node && typeof node.bigint === "string") {
    const raw = typeof node.raw === "string" ? node.raw : `${node.bigint}n`;
    return `BigInt literal (${raw}) — rejected by Google Apps Script's parser (even under ES2020)`;
  }

  if (typeof node.value === "number" && typeof node.raw === "string" && node.raw.includes("_")) {
    return `Numeric separator (${node.raw}) (ES2021) — unsupported by Google Apps Script's parser`;
  }

  if ("regex" in node && node.regex) {
    if (node.regex.flags.includes("d")) {
      return "RegExp /d (hasIndices) flag (ES2022) — unsupported by Google Apps Script's parser";
    }
    if (node.regex.flags.includes("v")) {
      return "RegExp /v (unicodeSets) flag (ES2024) — unsupported by Google Apps Script's parser";
    }
  }

  return undefined;
}

function on<K extends keyof VisitorObject>(
  key: K,
  handler: VisitorObject[K],
): [K, VisitorObject[K]] {
  return [key, handler];
}

/**
 * Inspect bundled JavaScript for syntax constructs rejected by Google Apps Script's
 * server-side V8 parser (ES2020 syntax minus BigInt literals).
 */
export function findGasSyntaxIssues(code: string): GasSyntaxIssue[] {
  if (code.trim().length === 0) {
    return [];
  }

  const parsed = parseSync("bundle.js", code, { sourceType: "module" });
  const issues: GasSyntaxIssue[] = parsed.errors.map((err) => ({
    line: 1,
    column: 1,
    reason: `JavaScript syntax error: ${err.message}`,
  }));

  if (!parsed.program) {
    return issues;
  }

  const scopeStack: boolean[] = [false];
  const pushIssue = (offset: number, reason: string) => {
    const loc = computeLineColumn(code, offset);
    issues.push({ line: loc.line, column: loc.column, reason });
  };
  const enterFn = () => {
    scopeStack.push(true);
  };
  const exitScope = () => {
    scopeStack.pop();
  };

  const visitor = new Visitor(
    Object.fromEntries([
      on("FunctionDeclaration", enterFn),
      on("FunctionDeclaration:exit", exitScope),
      on("FunctionExpression", enterFn),
      on("FunctionExpression:exit", exitScope),
      on("ArrowFunctionExpression", enterFn),
      on("ArrowFunctionExpression:exit", exitScope),
      on("Literal", (node) => {
        const reason = getLiteralIssueReason(node);
        if (reason) {
          pushIssue(node.start, reason);
        }
      }),
      on("AssignmentExpression", (node) => {
        if (LOGICAL_ASSIGNMENT_OPERATORS.has(node.operator)) {
          pushIssue(
            node.start,
            `Logical assignment operator (${node.operator}) (ES2021) — unsupported by Google Apps Script's parser`,
          );
        }
      }),
      on("PropertyDefinition", (node) => {
        pushIssue(
          node.start,
          "Class field declaration (ES2022) — unsupported by Google Apps Script's parser",
        );
      }),
      on("PrivateIdentifier", (node) => {
        pushIssue(
          node.start,
          `Private class element (#${node.name}) (ES2022) — unsupported by Google Apps Script's parser`,
        );
      }),
      on("StaticBlock", (node) => {
        scopeStack.push(false);
        pushIssue(
          node.start,
          "Class static initialization block (ES2022) — unsupported by Google Apps Script's parser",
        );
      }),
      on("StaticBlock:exit", exitScope),
      on("AwaitExpression", (node) => {
        if (scopeStack[scopeStack.length - 1] !== true) {
          pushIssue(
            node.start,
            "Top-level await (ES2022) — unsupported by Google Apps Script's parser",
          );
        }
      }),
      on("ForOfStatement", (node) => {
        if (node.await && scopeStack[scopeStack.length - 1] !== true) {
          pushIssue(
            node.start,
            "Top-level for-await-of loop (ES2022) — unsupported by Google Apps Script's parser",
          );
        }
      }),
      on("VariableDeclaration", (node) => {
        if (node.kind === "using" || node.kind === "await using") {
          pushIssue(
            node.start,
            `Explicit resource management (${node.kind}) — unsupported by Google Apps Script's parser`,
          );
        }
      }),
      on("Decorator", (node) => {
        pushIssue(node.start, "Decorator syntax — unsupported by Google Apps Script's parser");
      }),
    ]) as VisitorObject,
  );
  visitor.visit(parsed.program);

  return issues.sort((a, b) => a.line - b.line || a.column - b.column);
}

/**
 * Validate that bundled JavaScript is syntactically compatible with Google Apps Script.
 * Throws an Error with line/column details for every unsupported construct found.
 */
export function validateGasSyntax(code: string): void {
  const issues = findGasSyntaxIssues(code);
  if (issues.length === 0) {
    return;
  }

  const details = issues
    .map((issue) => `  - Line ${issue.line}:${issue.column}: ${issue.reason}`)
    .join("\n");

  throw new Error(
    `[@gas-plugin/unplugin] Unsupported Google Apps Script syntax in bundle (set build.target to "es2020" and avoid ES2021+ / BigInt literals):\n${details}`,
  );
}
