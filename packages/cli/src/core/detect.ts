import type { PackageManager } from "./types.js";

/** Detect the user's package manager from npm_config_user_agent env var. */
export function detectPackageManager(): PackageManager {
  const ua = process.env.npm_config_user_agent;
  if (ua?.startsWith("pnpm")) return "pnpm";
  if (ua?.startsWith("yarn")) return "yarn";
  if (ua?.startsWith("bun")) return "bun";
  return "npm";
}
