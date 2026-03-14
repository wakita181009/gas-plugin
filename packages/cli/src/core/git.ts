import { execSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const GITIGNORE_CONTENT = `node_modules/
dist/
.clasp.json
`;

/** Check if a directory is inside a git repository. */
function isInsideGitRepo(dir: string): boolean {
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      cwd: dir,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

/** Initialize a git repo and write .gitignore. Skips if already in a repo. */
export async function initGit(targetDir: string): Promise<void> {
  await writeFile(join(targetDir, ".gitignore"), GITIGNORE_CONTENT, "utf-8");

  if (isInsideGitRepo(targetDir)) {
    return;
  }

  execSync("git init", { cwd: targetDir, stdio: "ignore" });
}
