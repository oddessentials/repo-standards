// src/core/__tests__/conditions.test.ts
// Tests for condition detection + override precedence + unmet-condition lookup.

import { describe, it, expect } from "vitest";
import { evaluateConditions, firstUnmetCondition } from "../conditions.js";
import type { InputManifest } from "../../schemas/index.js";

function makeManifest(files: string[] = []): Omit<InputManifest, "input_hash"> {
  return {
    manifest_version: "1.0.0",
    created_at: "2024-01-01T00:00:00.000Z",
    repository_path: "/test/repo",
    git_commit: "abc123",
    git_branch: "main",
    git_dirty: false,
    standards_version: "7.0.0",
    standards_config_hash: "test-hash",
    files: files.map((path) => ({
      path,
      hash: "hash",
      size: 0,
      mtime: "2024-01-01T00:00:00.000Z",
    })),
  };
}

describe("evaluateConditions", () => {
  // Using a path that doesn't exist on disk keeps existsSync() from firing.
  const repoPath = "/nonexistent/test-repo";

  describe("has-database detection", () => {
    it("true when a migrations/ directory is present", () => {
      const manifest = makeManifest(["migrations/001_init.sql"]);
      const result = evaluateConditions(repoPath, manifest);
      expect(result["has-database"]).toBe(true);
    });

    it("true when prisma/schema.prisma is present", () => {
      const manifest = makeManifest(["prisma/schema.prisma"]);
      const result = evaluateConditions(repoPath, manifest);
      expect(result["has-database"]).toBe(true);
    });

    it("true when db/migrate/ directory is present", () => {
      const manifest = makeManifest(["db/migrate/20240101_create.rb"]);
      const result = evaluateConditions(repoPath, manifest);
      expect(result["has-database"]).toBe(true);
    });

    it("false when no database markers are present", () => {
      const manifest = makeManifest(["src/index.ts", "README.md"]);
      const result = evaluateConditions(repoPath, manifest);
      expect(result["has-database"]).toBe(false);
    });
  });

  describe("has-cli detection", () => {
    it("true when src/cli.ts is present", () => {
      const manifest = makeManifest(["src/cli.ts"]);
      const result = evaluateConditions(repoPath, manifest);
      expect(result["has-cli"]).toBe(true);
    });

    it("true when a top-level cli/ directory is present", () => {
      const manifest = makeManifest(["cli/main.ts"]);
      const result = evaluateConditions(repoPath, manifest);
      expect(result["has-cli"]).toBe(true);
    });

    it("false when no CLI markers are present", () => {
      const manifest = makeManifest(["src/index.ts", "README.md"]);
      const result = evaluateConditions(repoPath, manifest);
      expect(result["has-cli"]).toBe(false);
    });
  });

  describe("override precedence", () => {
    it("override=true forces true even when detection would say false", () => {
      const manifest = makeManifest(["src/index.ts"]); // no markers
      const result = evaluateConditions(repoPath, manifest, {
        "has-database": true,
      });
      expect(result["has-database"]).toBe(true);
    });

    it("override=false forces false even when detection would say true", () => {
      const manifest = makeManifest(["migrations/001_init.sql"]); // marker present
      const result = evaluateConditions(repoPath, manifest, {
        "has-database": false,
      });
      expect(result["has-database"]).toBe(false);
    });

    it("unrelated override leaves auto-detection untouched", () => {
      const manifest = makeManifest(["migrations/001_init.sql"]);
      const result = evaluateConditions(repoPath, manifest, {
        "has-cli": true,
      });
      expect(result["has-database"]).toBe(true);
      expect(result["has-cli"]).toBe(true);
    });
  });
});

describe("firstUnmetCondition", () => {
  const allMet = { "has-database": true, "has-cli": true };
  const dbOnly = { "has-database": true, "has-cli": false };

  it("returns null when the item has no conditions", () => {
    expect(firstUnmetCondition(undefined, allMet)).toBeNull();
    expect(firstUnmetCondition([], allMet)).toBeNull();
  });

  it("returns null when all listed conditions are met", () => {
    expect(firstUnmetCondition(["has-database"], allMet)).toBeNull();
    expect(firstUnmetCondition(["has-database", "has-cli"], allMet)).toBeNull();
  });

  it("returns the first unmet condition name when one is missing", () => {
    expect(firstUnmetCondition(["has-cli"], dbOnly)).toBe("has-cli");
  });

  it("returns the first unmet condition when multiple are listed", () => {
    expect(firstUnmetCondition(["has-database", "has-cli"], dbOnly)).toBe(
      "has-cli",
    );
  });

  it("treats unknown conditions as unmet", () => {
    expect(firstUnmetCondition(["unknown-condition"], allMet)).toBe(
      "unknown-condition",
    );
  });
});
