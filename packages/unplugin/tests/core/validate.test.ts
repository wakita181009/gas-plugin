import { describe, expect, it } from "vitest";
import { findGasSyntaxIssues, validateGasSyntax } from "../../src/core/validate.js";

describe("findGasSyntaxIssues", () => {
  it("returns empty array for empty input", () => {
    expect(findGasSyntaxIssues("")).toEqual([]);
    expect(findGasSyntaxIssues("   \n  ")).toEqual([]);
  });

  it("allows valid ES2020 syntax except BigInt literals", () => {
    const code = `
function onOpen(e) {
  const name = e?.user?.email ?? "unknown";
  const str = "1_000_000";
  return name + str;
}

async function fetchData() {
  return await Promise.resolve(42);
}

class Helper {
  greet() {
    return "hi";
  }
}
`;
    expect(findGasSyntaxIssues(code)).toEqual([]);
  });

  it("detects BigInt literals", () => {
    const issues = findGasSyntaxIssues("const big = 123n;\n");
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      line: 1,
      column: 13,
    });
    expect(issues[0].reason).toContain("BigInt literal (123n)");
  });

  it("detects numeric separators (ES2021)", () => {
    const issues = findGasSyntaxIssues("const n = 1_000_000;\n");
    expect(issues).toHaveLength(1);
    expect(issues[0].reason).toContain("Numeric separator (1_000_000)");
  });

  it("detects logical assignment operators (ES2021)", () => {
    const issues = findGasSyntaxIssues("let a; a ??= 1; a ||= 2; a &&= 3;\n");
    expect(issues).toHaveLength(3);
    expect(issues.map((i) => i.reason)).toEqual([
      expect.stringContaining("??="),
      expect.stringContaining("||="),
      expect.stringContaining("&&="),
    ]);
  });

  it("detects class fields, private elements, and static blocks (ES2022)", () => {
    const code = `
class Demo {
  x = 1;
  static y = 2;
  #secret = 3;
  #read() { return this.#secret; }
  static { console.log("init"); }
}
`;
    const issues = findGasSyntaxIssues(code);
    const reasons = issues.map((i) => i.reason);
    expect(reasons.some((r) => r.includes("Class field declaration"))).toBe(true);
    expect(reasons.some((r) => r.includes("Private class element (#secret)"))).toBe(true);
    expect(reasons.some((r) => r.includes("Private class element (#read)"))).toBe(true);
    expect(reasons.some((r) => r.includes("Class static initialization block"))).toBe(true);
  });

  it("detects top-level await and for-await-of while allowing await inside functions", () => {
    const topLevelAwait = findGasSyntaxIssues("const x = await Promise.resolve(1);\n");
    expect(topLevelAwait).toHaveLength(1);
    expect(topLevelAwait[0].reason).toContain("Top-level await");

    const topLevelForAwait = findGasSyntaxIssues("for await (const item of stream) {}\n");
    expect(topLevelForAwait).toHaveLength(1);
    expect(topLevelForAwait[0].reason).toContain("Top-level for-await-of");

    const insideAsyncFn = findGasSyntaxIssues(
      "async function run() {\n  for await (const x of stream) {}\n  return await Promise.resolve(1);\n}\n",
    );
    expect(insideAsyncFn).toEqual([]);
  });

  it("detects explicit resource management (using / await using)", () => {
    const issues = findGasSyntaxIssues("function f() {\n  using res = acquire();\n}\n");
    expect(issues).toHaveLength(1);
    expect(issues[0].reason).toContain("Explicit resource management (using)");
  });

  it("detects RegExp /d and /v flags", () => {
    const issues = findGasSyntaxIssues("const a = /foo/d;\nconst b = /bar/v;\n");
    expect(issues).toHaveLength(2);
    expect(issues[0].reason).toContain("/d");
    expect(issues[1].reason).toContain("/v");
  });
});

describe("validateGasSyntax", () => {
  it("does not throw for compatible code", () => {
    expect(() => validateGasSyntax("function onOpen() { return 1 ?? 2; }\n")).not.toThrow();
  });

  it("throws descriptive error with line and column for incompatible code", () => {
    expect(() => validateGasSyntax("function onOpen() {\n  return 42n;\n}\n")).toThrow(
      /Line 2:10: BigInt literal \(42n\)/,
    );
  });
});
