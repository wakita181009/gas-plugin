import { readFileSync } from "node:fs";
import type { Plugin } from "vite";
import { parse as parseYaml } from "yaml";

type CatalogMap = Record<string, string>;

interface WorkspaceCatalogs {
  catalog?: CatalogMap;
  catalogs?: Record<string, CatalogMap>;
}

interface Catalogs {
  default: CatalogMap;
  named: Record<string, CatalogMap>;
}

const CATALOG_PREFIX = "catalog:";
const DEP_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
] as const;

function loadCatalogs(workspaceFile: string): Catalogs {
  const ws = parseYaml(readFileSync(workspaceFile, "utf-8")) as WorkspaceCatalogs;
  return { default: ws.catalog ?? {}, named: ws.catalogs ?? {} };
}

function resolveSpecifier(name: string, spec: string, catalogs: Catalogs): string {
  const catalogName = spec.slice(CATALOG_PREFIX.length);
  const catalog =
    catalogName === "" || catalogName === "default"
      ? catalogs.default
      : catalogs.named[catalogName];
  const resolved = catalog?.[name];
  if (!resolved) {
    throw new Error(`No "${spec}" entry found for "${name}" in pnpm-workspace.yaml`);
  }
  return resolved;
}

/** Rewrite `catalog:` specifiers in every dependency field in place. Returns whether anything changed. */
function inlineCatalogs(pkg: Record<string, CatalogMap | undefined>, catalogs: Catalogs): boolean {
  let changed = false;
  for (const field of DEP_FIELDS) {
    const deps = pkg[field];
    if (!deps) continue;
    for (const [name, spec] of Object.entries(deps)) {
      if (spec.startsWith(CATALOG_PREFIX)) {
        deps[name] = resolveSpecifier(name, spec, catalogs);
        changed = true;
      }
    }
  }
  return changed;
}

/**
 * Inline `catalog:` specifiers into concrete versions when a `package.json` is
 * imported as a module. The CLI reads its own package.json to stamp dependency
 * versions into scaffolded standalone projects; those must be real versions,
 * not the `catalog:` protocol that only resolves inside this workspace.
 */
export function resolveCatalog(workspaceFile: string): Plugin {
  const catalogs = loadCatalogs(workspaceFile);
  return {
    name: "resolve-catalog",
    enforce: "pre",
    transform(code, id) {
      if (!id.split("?")[0].endsWith("package.json")) return null;
      const pkg = JSON.parse(code) as Record<string, CatalogMap | undefined>;
      return inlineCatalogs(pkg, catalogs) ? { code: JSON.stringify(pkg), map: null } : null;
    },
  };
}
