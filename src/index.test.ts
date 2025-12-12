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
