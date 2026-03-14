import { cpSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, "../src/templates");
const dest = resolve(__dirname, "../dist/templates");

cpSync(src, dest, { recursive: true });
