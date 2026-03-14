import { afterEach, describe, expect, it } from "vitest";
import { detectPackageManager } from "../../src/core/detect.js";

describe("detectPackageManager", () => {
  const originalEnv = process.env.npm_config_user_agent;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.npm_config_user_agent;
    } else {
      process.env.npm_config_user_agent = originalEnv;
    }
  });

  it("detects pnpm", () => {
    process.env.npm_config_user_agent = "pnpm/10.0.0 node/v20.0.0";
    expect(detectPackageManager()).toBe("pnpm");
  });

  it("detects yarn", () => {
    process.env.npm_config_user_agent = "yarn/4.0.0 node/v20.0.0";
    expect(detectPackageManager()).toBe("yarn");
  });

  it("detects bun", () => {
    process.env.npm_config_user_agent = "bun/1.0.0 node/v20.0.0";
    expect(detectPackageManager()).toBe("bun");
  });

  it("detects npm", () => {
    process.env.npm_config_user_agent = "npm/10.0.0 node/v20.0.0";
    expect(detectPackageManager()).toBe("npm");
  });

  it("falls back to npm when env var is missing", () => {
    delete process.env.npm_config_user_agent;
    expect(detectPackageManager()).toBe("npm");
  });
});
