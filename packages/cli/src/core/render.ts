import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { RenderContext } from "./types.js";

/** Replace all {{key}} placeholders in content with values from context. */
export function renderTemplate(content: string, context: RenderContext): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return key in context ? context[key] : match;
  });
}

/** Read a file, apply placeholder substitution, and write to destination. */
export async function renderFile(
  srcPath: string,
  destPath: string,
  context: RenderContext,
): Promise<void> {
  const content = await readFile(srcPath, "utf-8");
  const rendered = renderTemplate(content, context);
  await mkdir(dirname(destPath), { recursive: true });
  await writeFile(destPath, rendered, "utf-8");
}
