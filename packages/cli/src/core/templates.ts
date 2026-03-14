import type { BundlerConfig, BundlerId, TemplateDefinition, TemplateId } from "./types.js";

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "basic",
    label: "Basic Script",
    description: "Spreadsheet automation with onOpen trigger",
    sourceDir: "basic",
    oauthScopes: ["https://www.googleapis.com/auth/spreadsheets"],
    globals: ["onOpen"],
    hasHtml: false,
  },
  {
    id: "webapp",
    label: "Web App",
    description: "Web app with doGet/doPost and HTML client",
    sourceDir: "webapp",
    oauthScopes: ["https://www.googleapis.com/auth/script.external_request"],
    globals: ["doGet", "doPost"],
    hasHtml: true,
  },
  {
    id: "library",
    label: "Library",
    description: "Reusable GAS library with exported functions",
    sourceDir: "library",
    oauthScopes: [],
    globals: [],
    hasHtml: false,
  },
];

export const BUNDLERS: BundlerConfig[] = [
  {
    id: "vite",
    label: "Vite",
    configFile: "vite.config.ts",
    importPath: "@gas-plugin/unplugin/vite",
    devDependencies: {
      vite: "^6.0.0",
      "@gas-plugin/unplugin": "^0.0.6",
    },
    buildCommand: "vite build",
  },
  {
    id: "rollup",
    label: "Rollup",
    configFile: "rollup.config.mjs",
    importPath: "@gas-plugin/unplugin/rollup",
    devDependencies: {
      rollup: "^4.0.0",
      "@rollup/plugin-typescript": "^12.0.0",
      "@gas-plugin/unplugin": "^0.0.6",
    },
    buildCommand: "rollup -c",
  },
  {
    id: "esbuild",
    label: "esbuild",
    configFile: "esbuild.config.mjs",
    importPath: "@gas-plugin/unplugin/esbuild",
    devDependencies: {
      esbuild: "^0.24.0",
      "@gas-plugin/unplugin": "^0.0.6",
    },
    buildCommand: "node esbuild.config.mjs",
  },
  {
    id: "webpack",
    label: "webpack",
    configFile: "webpack.config.mjs",
    importPath: "@gas-plugin/unplugin/webpack",
    devDependencies: {
      webpack: "^5.0.0",
      "webpack-cli": "^6.0.0",
      "ts-loader": "^9.0.0",
      "@gas-plugin/unplugin": "^0.0.6",
    },
    buildCommand: "webpack",
  },
];

export function getTemplate(id: TemplateId): TemplateDefinition | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getBundler(id: BundlerId): BundlerConfig | undefined {
  return BUNDLERS.find((b) => b.id === id);
}
