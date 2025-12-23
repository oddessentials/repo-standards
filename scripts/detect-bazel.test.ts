// scripts/detect-bazel.test.ts

import { describe, it, expect } from "vitest";
import { detectBazel } from "./detect-bazel.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.resolve(__dirname, "..", "test", "fixtures");

describe("detectBazel", () => {
  it("detects bzlmod repo via MODULE.bazel", () => {
    const result = detectBazel(path.join(fixtures, "bzlmod-repo"));
    expect(result.detected).toBe(true);
    expect(result.mode).toBe("bzlmod");
    expect(result.markers).toContain("MODULE.bazel");
  });

  it("detects .bazelversion as optional marker", () => {
    const result = detectBazel(path.join(fixtures, "bzlmod-repo"));
    expect(result.markers).toContain(".bazelversion");
  });

  it("detects workspace repo via WORKSPACE.bazel", () => {
    const result = detectBazel(path.join(fixtures, "workspace-repo"));
    expect(result.detected).toBe(true);
    expect(result.mode).toBe("workspace");
    expect(result.markers).toContain("WORKSPACE.bazel");
  });

  it("does NOT detect non-Bazel repo (regression)", () => {
    const result = detectBazel(path.join(fixtures, "no-bazel-repo"));
    expect(result.detected).toBe(false);
    expect(result.mode).toBeUndefined();
    expect(result.markers).toHaveLength(0);
  });

  it("detects hybrid monorepo at root level only", () => {
    const result = detectBazel(path.join(fixtures, "hybrid-monorepo"));
    expect(result.detected).toBe(true);
    expect(result.mode).toBe("bzlmod");
    expect(result.markers).toContain("MODULE.bazel");
    // Does NOT include nested BUILD files in markers
    expect(result.markers).not.toContain("apps/web/BUILD.bazel");
    expect(result.markers).not.toContain("libs/vendored/BUILD.bazel");
  });

  it("prefers bzlmod over workspace when MODULE.bazel exists", () => {
    // The bzlmod-repo fixture has MODULE.bazel, should be detected as bzlmod
    const result = detectBazel(path.join(fixtures, "bzlmod-repo"));
    expect(result.mode).toBe("bzlmod");
  });
});
