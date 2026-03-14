import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { initGit } from "../../src/core/git.js";

describe("initGit", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "gas-cli-test-git-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("creates .gitignore with correct content", async () => {
    await initGit(tempDir);
    const gitignore = readFileSync(join(tempDir, ".gitignore"), "utf-8");
    expect(gitignore).toContain("node_modules/");
    expect(gitignore).toContain("dist/");
    expect(gitignore).toContain(".clasp.json");
  });

  it("initializes a git repo in a new directory", async () => {
    await initGit(tempDir);
    expect(existsSync(join(tempDir, ".git"))).toBe(true);
  });

  it("skips git init if already inside a git repo", async () => {
    // Init a git repo first
    execSync("git init", { cwd: tempDir, stdio: "ignore" });
    const subDir = join(tempDir, "subdir");
    await import("node:fs/promises").then((fs) => fs.mkdir(subDir));

    // Should not create a new .git in subdir
    await initGit(subDir);
    expect(existsSync(join(subDir, ".git"))).toBe(false);
    // But .gitignore should still be created
    expect(existsSync(join(subDir, ".gitignore"))).toBe(true);
  });
});
