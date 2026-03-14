/** Resolved options for the scaffolding pipeline. */
export interface ScaffoldOptions {
  projectName: string;
  template: TemplateId;
  bundler: BundlerId;
  installDeps: boolean;
  clasp: boolean;
  scriptId?: string;
  packageManager: PackageManager;
  targetDir: string;
}

export type TemplateId = "basic" | "webapp";
export type BundlerId = "vite" | "rollup" | "esbuild" | "webpack";
export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

/** Metadata for a project template in the registry. */
export interface TemplateDefinition {
  id: TemplateId;
  label: string;
  description: string;
  sourceDir: string;
  oauthScopes: string[];
  globals: string[];
  hasHtml: boolean;
}

/** Metadata for a bundler choice in the registry. */
export interface BundlerConfig {
  id: BundlerId;
  label: string;
  configFile: string;
  importPath: string;
  devDependencies: Record<string, string>;
  buildCommand: string;
}

/** Context object for {{placeholder}} template substitution. */
export interface RenderContext {
  projectName: string;
  bundlerConfigFile: string;
  bundlerImport: string;
  buildCommand: string;
  oauthScopes: string;
  globals: string;
  year: string;
  [key: string]: string;
}
