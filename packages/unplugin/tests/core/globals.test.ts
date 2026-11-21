import { describe, expect, it } from "vitest";
import { detectNamesToProtect } from "../../src/core/globals.js";

describe("detectNamesToProtect", () => {
  describe("autoGlobals: true", () => {
    it("detects exported function declarations", () => {
      const code = "export function onOpen() {}\nexport function doGet() {}";
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual(["onOpen", "doGet"]);
    });

    it("detects exported async function declarations", () => {
      const code = "export async function doPost(e) { return e; }";
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual(["doPost"]);
    });

    it("detects exported const declarations", () => {
      const code = "export const handler = () => {};";
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual(["handler"]);
    });

    it("detects exported let declarations", () => {
      const code = "export let counter = 0;";
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual(["counter"]);
    });

    it("detects exported var declarations", () => {
      const code = "export var legacy = true;";
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual(["legacy"]);
    });

    it("detects exported class declarations", () => {
      const code = "export class MyService {}";
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual(["MyService"]);
    });

    it("detects export specifier lists (export { a, b })", () => {
      const code = "function fnA() {}\nconst constB = 42;\nexport { fnA, constB };";
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual(["fnA", "constB"]);
    });

    it("detects aliased export specifiers by local binding name", () => {
      const code = "function realFn() {}\nexport { realFn as aliasFn };";
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual(["realFn"]);
    });

    it("detects named default function and class exports", () => {
      const code = "export default function defaultHandler() {}";
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual(["defaultHandler"]);

      const codeClass = "export default class DefaultApp {}";
      const resultClass = detectNamesToProtect(codeClass, [], true);
      expect(resultClass).toEqual(["DefaultApp"]);
    });

    it("detects destructuring variable declarations in exports", () => {
      const code =
        "export const [first, second] = [1, 2];\nexport const { key, nested: { prop } } = obj;";
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual(["first", "second", "key", "prop"]);
    });

    it("ignores exports in comments and strings", () => {
      const code = `
        // export function commentedFn() {}
        /*
          export const commentedConst = 1;
        */
        const msg = "export function fakeInString() {}";
        export function realFn() {}
      `;
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual(["realFn"]);
    });

    it("ignores TypeScript type-only exports", () => {
      const code = `
        export type MyType = string;
        export interface MyInterface { prop: number; }
        const val = 1;
        type LocalType = number;
        export { type LocalType, val };
      `;
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual(["val"]);
    });

    it("ignores re-exports from external modules", () => {
      const code = "export { externalFn } from './other.js';";
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual([]);
    });
  });

  describe("autoGlobals: false", () => {
    it("does not auto-detect exported names", () => {
      const code = "export function onOpen() {}";
      const result = detectNamesToProtect(code, [], false);
      expect(result).toEqual([]);
    });

    it("returns globals that are declared in the code", () => {
      const code = "function processData() { return 1; }";
      const result = detectNamesToProtect(code, ["processData"], false);
      expect(result).toEqual(["processData"]);
    });
  });

  describe("globals filtering", () => {
    it("filters out globals not declared in the code", () => {
      const code = "function onOpen() {}";
      const result = detectNamesToProtect(code, ["onOpen", "notDeclared"], true);
      expect(result).toEqual(["onOpen"]);
    });

    it("filters out identifiers declared inside nested function scopes", () => {
      const code = `
        function outer() {
          const innerVar = 10;
          return innerVar;
        }
      `;
      const result = detectNamesToProtect(code, ["innerVar"], false);
      expect(result).toEqual([]);
    });

    it("returns empty array when no globals and no exports", () => {
      const code = "function internal() {}";
      const result = detectNamesToProtect(code, [], true);
      expect(result).toEqual([]);
    });

    it("returns empty array when globals is empty and autoGlobals is false", () => {
      const code = "export function onOpen() {}";
      const result = detectNamesToProtect(code, [], false);
      expect(result).toEqual([]);
    });
  });

  describe("deduplication", () => {
    it("does not duplicate when a name is both in globals and exported", () => {
      const code = "export function onOpen() {}";
      const result = detectNamesToProtect(code, ["onOpen"], true);
      expect(result).toEqual(["onOpen"]);
    });
  });

  describe("regex safety", () => {
    it("handles names with regex-special characters in globals gracefully", () => {
      const code = "function normal() {}";
      const result = detectNamesToProtect(code, ["func.name", "a+b"], true);
      expect(result).toEqual([]);
    });
  });
});
