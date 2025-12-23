import { describe, it, expect } from "vitest";
import {
  loadMasterSpec,
  listSupportedStacks,
  listSupportedCiSystems,
} from "./index.js";

describe("repo-standards API", () => {
  // Note: These tests require dist/config/ to exist with the generated JSON files.
  // They will fail if run before `npm run build`.

  it("listSupportedStacks returns expected stacks", () => {
    const stacks = listSupportedStacks();
    expect(stacks).toContain("typescript-js");
    expect(stacks).toContain("csharp-dotnet");
    expect(stacks).toContain("python");
    expect(stacks).toContain("rust");
    expect(stacks).toContain("go");
  });

  it("listSupportedCiSystems returns expected CI systems", () => {
    const ciSystems = listSupportedCiSystems();
    expect(ciSystems).toContain("azure-devops");
    expect(ciSystems).toContain("github-actions");
  });

  it("loadMasterSpec returns a valid spec object", () => {
    const spec = loadMasterSpec();
    expect(spec).toHaveProperty("version");
    expect(spec).toHaveProperty("stacks");
    expect(spec).toHaveProperty("checklist");
  });
});

describe("dependency governance items", () => {
  it("schema version is 3", () => {
    const spec = loadMasterSpec();
    expect(spec.version).toBe(3);
  });

  it("recommended section includes both dependency items", () => {
    const spec = loadMasterSpec();
    const ids = spec.checklist.recommended.map((i: { id: string }) => i.id);
    expect(ids).toContain("dependency-update-automation");
    expect(ids).toContain("dependency-architecture-rules");
  });

  it("dependency-update-automation has anyOfFiles for typescript-js", () => {
    const spec = loadMasterSpec();
    const item = spec.checklist.recommended.find(
      (i: { id: string }) => i.id === "dependency-update-automation",
    );
    const anyOf = item?.stackHints?.["typescript-js"]?.anyOfFiles;
    expect(anyOf).toContain("renovate.json");
    expect(anyOf).toContain(".github/dependabot.yml");
  });

  it("dependency items have distinct tool scopes from dependency-security", () => {
    const spec = loadMasterSpec();
    const depSecTools =
      spec.checklist.core.find(
        (i: { id: string }) => i.id === "dependency-security",
      )?.stackHints?.["typescript-js"]?.exampleTools ?? [];
    const depUpdateTools =
      spec.checklist.recommended.find(
        (i: { id: string }) => i.id === "dependency-update-automation",
      )?.stackHints?.["typescript-js"]?.exampleTools ?? [];

    // Verify they reference different tools - no overlap
    expect(depSecTools).toContain("npm audit");
    expect(depUpdateTools).toContain("renovate");
    expect(depSecTools).not.toContain("renovate");
    expect(depUpdateTools).not.toContain("npm audit");
  });

  it("migrationGuide Step 3 includes dependency-update-automation", () => {
    const spec = loadMasterSpec();
    const step3 = spec.meta?.migrationGuide?.find(
      (s: { step: number }) => s.step === 3,
    );
    expect(step3?.focusIds).toContain("dependency-update-automation");
  });
});

describe("bazel integration", () => {
  it("meta includes bazelIntegration section", () => {
    const spec = loadMasterSpec();
    expect(spec.meta?.bazelIntegration).toBeDefined();
    expect(spec.meta?.bazelIntegration?.detectionRules).toBeDefined();
  });

  it("bazelIntegration has root markers for detection", () => {
    const spec = loadMasterSpec();
    const rootMarkers =
      spec.meta?.bazelIntegration?.detectionRules?.rootMarkers;
    expect(rootMarkers).toContain("MODULE.bazel");
    expect(rootMarkers).toContain("WORKSPACE.bazel");
    expect(rootMarkers).toContain("WORKSPACE");
  });

  it("bazelIntegration has opt-out mechanism", () => {
    const spec = loadMasterSpec();
    expect(spec.meta?.bazelIntegration?.optOut).toBeDefined();
    expect(spec.meta?.bazelIntegration?.optOut?.configPath).toBe(
      "meta.bazelIntegration.enabled",
    );
  });

  it("linting item has bazelHints with commands for typescript-js", () => {
    const spec = loadMasterSpec();
    const linting = spec.checklist.core.find(
      (i: { id: string }) => i.id === "linting",
    );
    const bazelHints = linting?.stackHints?.["typescript-js"]?.bazelHints;
    expect(bazelHints).toBeDefined();
    expect(bazelHints?.commands).toBeDefined();
    expect(bazelHints?.commands?.length).toBeGreaterThan(0);
  });

  it("bazelHints uses commands format, not assumed pattern labels", () => {
    const spec = loadMasterSpec();
    const unitTest = spec.checklist.core.find(
      (i: { id: string }) => i.id === "unit-test-runner",
    );
    const bazelHints = unitTest?.stackHints?.["typescript-js"]?.bazelHints;
    // Should be "bazel test //..." not "//...:test"
    expect(bazelHints?.commands?.[0]).toMatch(/^bazel /);
  });

  it("ci-quality-gates has bazelHints for all stacks", () => {
    const spec = loadMasterSpec();
    const ciGates = spec.checklist.core.find(
      (i: { id: string }) => i.id === "ci-quality-gates",
    );
    const stacks = ["typescript-js", "python", "rust", "go", "csharp-dotnet"];
    for (const stack of stacks) {
      const bazelHints = ciGates?.stackHints?.[stack]?.bazelHints;
      expect(bazelHints?.commands).toBeDefined();
    }
  });
});
