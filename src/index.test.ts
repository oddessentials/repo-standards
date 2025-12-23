import { describe, it, expect } from "vitest";
import {
  loadMasterSpec,
  listSupportedStacks,
  listSupportedCiSystems,
} from "./index.js";
import stableStringify from "fast-json-stable-stringify";

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

describe("bazel integration", () => {
  it("meta includes executorHints.bazel section", () => {
    const spec = loadMasterSpec();
    expect(spec.meta?.executorHints?.bazel).toBeDefined();
    expect(spec.meta?.executorHints?.bazel?.detectionRules).toBeDefined();
  });

  it("executorHints.bazel has root markers for detection", () => {
    const spec = loadMasterSpec();
    const rootMarkers =
      spec.meta?.executorHints?.bazel?.detectionRules?.rootMarkers;
    expect(rootMarkers).toContain("MODULE.bazel");
    expect(rootMarkers).toContain("WORKSPACE.bazel");
    expect(rootMarkers).toContain("WORKSPACE");
  });

  it("executorHints.bazel has opt-out mechanism", () => {
    const spec = loadMasterSpec();
    expect(spec.meta?.executorHints?.bazel?.optOut).toBeDefined();
    expect(spec.meta?.executorHints?.bazel?.optOut?.configPath).toBe(
      "meta.executorHints.bazel.enabled",
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
    const stacks = [
      "typescript-js",
      "python",
      "rust",
      "go",
      "csharp-dotnet",
    ] as const;
    for (const stack of stacks) {
      const bazelHints = ciGates?.stackHints?.[stack]?.bazelHints;
      expect(bazelHints?.commands).toBeDefined();
    }
  });
});

describe("schema validation", () => {
  it("defaultCoverageThreshold is a valid ratio (0-1)", () => {
    const spec = loadMasterSpec();
    const threshold = spec.meta?.defaultCoverageThreshold;
    expect(threshold).toBeGreaterThanOrEqual(0);
    expect(threshold).toBeLessThanOrEqual(1);
  });

  it("coverageThresholdUnit documents ratio semantics", () => {
    const spec = loadMasterSpec();
    expect(spec.meta?.coverageThresholdUnit).toBe("ratio");
  });

  it("all checklist IDs are unique", () => {
    const spec = loadMasterSpec();
    const ids = [
      ...spec.checklist.core.map((i: { id: string }) => i.id),
      ...spec.checklist.recommended.map((i: { id: string }) => i.id),
      ...spec.checklist.optionalEnhancements.map((i: { id: string }) => i.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("migrationGuide focusIds reference valid checklist IDs", () => {
    const spec = loadMasterSpec();
    const allIds = new Set([
      ...spec.checklist.core.map((i: { id: string }) => i.id),
      ...spec.checklist.recommended.map((i: { id: string }) => i.id),
      ...spec.checklist.optionalEnhancements.map((i: { id: string }) => i.id),
    ]);
    for (const step of spec.meta?.migrationGuide ?? []) {
      for (const focusId of step.focusIds ?? []) {
        expect(allIds.has(focusId)).toBe(true);
      }
    }
  });

  it("appliesTo.stacks only references valid stack keys", () => {
    const spec = loadMasterSpec();
    const validStacks = new Set(Object.keys(spec.stacks));
    const allItems = [
      ...spec.checklist.core,
      ...spec.checklist.recommended,
      ...spec.checklist.optionalEnhancements,
    ];
    for (const item of allItems) {
      for (const stack of item.appliesTo?.stacks ?? []) {
        expect(validStacks.has(stack)).toBe(true);
      }
    }
  });

  it("ciHints keys only use valid ciSystems", () => {
    const spec = loadMasterSpec();
    const validCiSystems = new Set<string>(spec.ciSystems);
    const allItems = [
      ...spec.checklist.core,
      ...spec.checklist.recommended,
      ...spec.checklist.optionalEnhancements,
    ];
    for (const item of allItems) {
      for (const ciKey of Object.keys(item.ciHints ?? {})) {
        expect(validCiSystems.has(ciKey)).toBe(true);
      }
    }
  });

  it("Rust dependency-security uses anyOfFiles for Cargo.lock (library compatibility)", () => {
    const spec = loadMasterSpec();
    const depSec = spec.checklist.core.find(
      (i: { id: string }) => i.id === "dependency-security",
    );
    const rustHints = depSec?.stackHints?.rust;
    expect(rustHints?.requiredFiles).toBeUndefined();
    expect(rustHints?.anyOfFiles).toContain("Cargo.lock");
    expect(rustHints?.pinningNotes).toMatch(/librar/i);
  });
});

describe("enforcement and severity", () => {
  it("core items have enforcement=required and severity=error", () => {
    const spec = loadMasterSpec();
    for (const item of spec.checklist.core) {
      expect(item.enforcement).toBe("required");
      expect(item.severity).toBe("error");
    }
  });

  it("recommended items have enforcement=recommended and severity=warn", () => {
    const spec = loadMasterSpec();
    for (const item of spec.checklist.recommended) {
      expect(item.enforcement).toBe("recommended");
      expect(item.severity).toBe("warn");
    }
  });

  it("optionalEnhancements items have enforcement=optional and severity=info", () => {
    const spec = loadMasterSpec();
    for (const item of spec.checklist.optionalEnhancements) {
      expect(item.enforcement).toBe("optional");
      expect(item.severity).toBe("info");
    }
  });
});

describe("determinism contract", () => {
  it("normalized output is byte-for-byte identical across runs (deep stable sort)", () => {
    const spec1 = loadMasterSpec();
    const spec2 = loadMasterSpec();

    // Use deep stable stringify for proper key ordering at all depths
    const normalized1 = stableStringify(spec1);
    const normalized2 = stableStringify(spec2);

    expect(normalized1).toBe(normalized2);
  });

  it("config structure is stable and predictable", () => {
    const spec = loadMasterSpec();

    // Verify expected structure exists
    expect(spec.checklist.core.length).toBeGreaterThan(0);
    expect(spec.checklist.recommended.length).toBeGreaterThan(0);
    expect(Object.keys(spec.stacks).length).toBe(5);
    expect(spec.ciSystems.length).toBe(2);
  });
});

describe("documentation sync (prevents version drift)", () => {
  it("README schema version reference matches actual standards.json version", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const spec = loadMasterSpec();
    const actualVersion = spec.version;

    const readmePath = path.resolve(process.cwd(), "README.md");
    const readme = fs.readFileSync(readmePath, "utf8");

    // Check the "currently `N`" reference in README
    const versionMatch = readme.match(/version.*\(currently `(\d+)`\)/i);
    expect(versionMatch).not.toBeNull();
    expect(Number(versionMatch![1])).toBe(actualVersion);
  });

  it("README documents the current schema version in version list", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const spec = loadMasterSpec();
    const actualVersion = spec.version;

    const readmePath = path.resolve(process.cwd(), "README.md");
    const readme = fs.readFileSync(readmePath, "utf8");

    // Check that the version list includes the current version
    const versionListPattern = new RegExp(`-\\s*\`${actualVersion}\`\\s*—`);
    expect(readme).toMatch(versionListPattern);
  });

  it("schema version matches package.json major version", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const spec = loadMasterSpec();
    const pkgPath = path.resolve(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const pkgMajor = parseInt(pkg.version.split(".")[0], 10);

    expect(spec.version).toBe(pkgMajor);
  });
});
