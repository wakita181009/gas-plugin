import { parseSync, type Statement } from "oxc-parser";

type ASTNode = {
  type?: string;
  name?: string;
  properties?: unknown[];
  elements?: unknown[];
  value?: unknown;
  argument?: unknown;
  left?: unknown;
  [key: string]: unknown;
};

function extractObjectPatternBindings(properties: unknown[], names: Set<string>): void {
  for (const prop of properties) {
    if (!prop || typeof prop !== "object") continue;
    const p = prop as ASTNode;
    if (p.type === "Property" && p.value) {
      extractBindingNames(p.value, names);
    } else if (p.type === "RestElement" && p.argument) {
      extractBindingNames(p.argument, names);
    }
  }
}

function extractArrayPatternBindings(elements: unknown[], names: Set<string>): void {
  for (const elem of elements) {
    if (elem) extractBindingNames(elem, names);
  }
}

function extractBindingNames(node: unknown, names: Set<string>): void {
  if (!node || typeof node !== "object") return;
  const n = node as ASTNode;

  switch (n.type) {
    case "Identifier":
      if (typeof n.name === "string") names.add(n.name);
      break;
    case "ObjectPattern":
      if (Array.isArray(n.properties)) extractObjectPatternBindings(n.properties, names);
      break;
    case "ArrayPattern":
      if (Array.isArray(n.elements)) extractArrayPatternBindings(n.elements, names);
      break;
    case "AssignmentPattern":
      if (n.left) extractBindingNames(n.left, names);
      break;
    case "RestElement":
      if (n.argument) extractBindingNames(n.argument, names);
      break;
    default:
      break;
  }
}

function extractDeclarationNames(decl: unknown, names: Set<string>): void {
  if (!decl || typeof decl !== "object") return;
  const d = decl as {
    type?: string;
    id?: { name?: string };
    declarations?: Array<{ id?: unknown }>;
  };

  const isNamed =
    (d.type === "FunctionDeclaration" ||
      d.type === "ClassDeclaration" ||
      d.type === "TSEnumDeclaration") &&
    d.id?.name;

  if (isNamed && d.id?.name) {
    names.add(d.id.name);
    return;
  }

  if (d.type === "VariableDeclaration" && Array.isArray(d.declarations)) {
    for (const declarator of d.declarations) {
      if (declarator.id) extractBindingNames(declarator.id, names);
    }
  }
}

function collectDeclaredNames(body: Statement[]): Set<string> {
  const declared = new Set<string>();

  for (const node of body) {
    if (
      node.type === "FunctionDeclaration" ||
      node.type === "ClassDeclaration" ||
      node.type === "VariableDeclaration" ||
      node.type === "TSEnumDeclaration"
    ) {
      extractDeclarationNames(node, declared);
    } else if (node.type === "ExportNamedDeclaration" && node.declaration) {
      extractDeclarationNames(node.declaration, declared);
    } else if (node.type === "ExportDefaultDeclaration" && node.declaration) {
      extractDeclarationNames(node.declaration, declared);
    }
  }

  return declared;
}

function collectExportNamed(
  node: Extract<Statement, { type: "ExportNamedDeclaration" }>,
  exported: Set<string>,
): void {
  if (node.exportKind === "type") return;

  if (node.declaration) {
    extractDeclarationNames(node.declaration, exported);
  } else if (!node.source && Array.isArray(node.specifiers)) {
    for (const spec of node.specifiers) {
      if (spec.exportKind !== "type" && spec.local?.type === "Identifier") {
        exported.add(spec.local.name);
      }
    }
  }
}

function collectExportDefault(
  node: Extract<Statement, { type: "ExportDefaultDeclaration" }>,
  exported: Set<string>,
): void {
  const decl = node.declaration;
  if (
    (decl.type === "FunctionDeclaration" || decl.type === "ClassDeclaration") &&
    "id" in decl &&
    decl.id?.name
  ) {
    exported.add(decl.id.name);
  }
}

function collectExportedNames(body: Statement[]): string[] {
  const exported = new Set<string>();

  for (const node of body) {
    if (node.type === "ExportNamedDeclaration") {
      collectExportNamed(node, exported);
    } else if (node.type === "ExportDefaultDeclaration") {
      collectExportDefault(node, exported);
    }
  }

  return Array.from(exported);
}

export function detectNamesToProtect(
  code: string,
  globals: string[],
  autoGlobals: boolean,
): string[] {
  const result = parseSync("module.tsx", code);
  if (!result.program) return [];

  const declaredNames = collectDeclaredNames(result.program.body);
  const namesToProtect: string[] = [];
  const seen = new Set<string>();

  function addName(name: string) {
    if (!seen.has(name) && declaredNames.has(name)) {
      seen.add(name);
      namesToProtect.push(name);
    }
  }

  for (const name of globals) {
    addName(name);
  }

  if (autoGlobals) {
    const exportedNames = collectExportedNames(result.program.body);
    for (const name of exportedNames) {
      addName(name);
    }
  }

  return namesToProtect;
}
