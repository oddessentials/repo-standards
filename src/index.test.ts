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
  it("schema version is 2", () => {
    const spec = loadMasterSpec();
    expect(spec.version).toBe(2);
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
