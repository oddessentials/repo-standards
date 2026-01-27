// src/commands/__tests__/verify.test.ts
// Integration tests for the verify command

import { describe, it, expect } from "vitest";
import { verify } from "../verify.js";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("verify command", () => {
  // Create a temporary test repo
  function createTestRepo(
    name: string,
    files: Record<string, string> = {},
  ): string {
    const testDir = join(tmpdir(), `repo-std-test-${name}-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    // Create .odd directory and standards.toml
    const oddDir = join(testDir, ".odd");
    mkdirSync(oddDir, { recursive: true });
    writeFileSync(
      join(oddDir, "standards.toml"),
      `version = "7.0.0"\nstack = "typescript-js"\n\n[[packs]]\nid = "core"\nenabled = true\n`,
    );

    // Create requested files
    for (const [path, content] of Object.entries(files)) {
      const filePath = join(testDir, path);
      const fileDir = join(filePath, "..");
      mkdirSync(fileDir, { recursive: true });
      writeFileSync(filePath, content, "utf8");
    }

    return testDir;
  }

  function cleanup(dir: string): void {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }

  it("should return valid VerifyResult structure", async () => {
    const testRepo = createTestRepo("basic", {
      "package.json": JSON.stringify({ name: "test" }),
    });

    try {
      const result = await verify(testRepo);

      expect(result).toBeDefined();
      expect(result.schema_version).toBe("1.1.0");
      expect(result.input_hash).toBeDefined();
      expect(result.input_hash).toMatch(/^[a-f0-9]{64}$/);
      expect(result.verified_at).toBeDefined();
      expect(typeof result.is_compliant).toBe("boolean");
      expect(result.standards_version).toBeDefined();
      expect(result.stack_id).toBe("typescript-js");
      expect(Array.isArray(result.findings)).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.repository_path).toBe(testRepo);
      expect(typeof result.execution_time_ms).toBe("number");
    } finally {
      cleanup(testRepo);
    }
  });

  it("should produce identical input_hash on repeated runs (determinism)", async () => {
    const testRepo = createTestRepo("determinism", {
      "package.json": JSON.stringify({ name: "test" }),
      "README.md": "# Test",
    });

    try {
      const result1 = await verify(testRepo);
      const result2 = await verify(testRepo);

      expect(result1.input_hash).toBe(result2.input_hash);
    } finally {
      cleanup(testRepo);
    }
  });

  it("should classify findings by severity", async () => {
    const testRepo = createTestRepo("severity");

    try {
      const result = await verify(testRepo);

      expect(result.summary.by_severity).toBeDefined();
      expect(typeof result.summary.by_severity.error).toBe("number");
      expect(typeof result.summary.by_severity.warn).toBe("number");
      expect(typeof result.summary.by_severity.info).toBe("number");

      const total =
        result.summary.by_severity.error +
        result.summary.by_severity.warn +
        result.summary.by_severity.info;
      expect(total).toBe(result.summary.total);
    } finally {
      cleanup(testRepo);
    }
  });

  it("should classify findings by remediation class", async () => {
    const testRepo = createTestRepo("remediation");

    try {
      const result = await verify(testRepo);

      expect(result.summary.by_remediation_class).toBeDefined();
      expect(typeof result.summary.by_remediation_class.mechanical).toBe(
        "number",
      );
      expect(typeof result.summary.by_remediation_class.ai).toBe("number");
      expect(typeof result.summary.by_remediation_class.human).toBe("number");

      const total =
        result.summary.by_remediation_class.mechanical +
        result.summary.by_remediation_class.ai +
        result.summary.by_remediation_class.human;
      expect(total).toBe(result.summary.total);
    } finally {
      cleanup(testRepo);
    }
  });

  it("should include session_id when provided in options", async () => {
    const testRepo = createTestRepo("session");

    try {
      const sessionId = "test-session-123";
      const result = await verify(testRepo, { session_id: sessionId });

      expect(result.session_id).toBe(sessionId);
    } finally {
      cleanup(testRepo);
    }
  });

  it("should produce different input_hash when files change", async () => {
    const testRepo1 = createTestRepo("change-1", {
      "package.json": JSON.stringify({ name: "test1" }),
    });
    const testRepo2 = createTestRepo("change-2", {
      "package.json": JSON.stringify({ name: "test2", version: "1.0.0" }),
    });

    try {
      const result1 = await verify(testRepo1);
      const result2 = await verify(testRepo2);

      // Different content should produce different hashes
      expect(result1.input_hash).not.toBe(result2.input_hash);
    } finally {
      cleanup(testRepo1);
      cleanup(testRepo2);
    }
  });

  it("should have valid finding metadata", async () => {
    const testRepo = createTestRepo("findings");

    try {
      const result = await verify(testRepo);

      for (const finding of result.findings) {
        // Check all required fields exist
        expect(finding.finding_id).toBeDefined();
        expect(finding.rule_id).toBeDefined();
        expect(finding.severity).toBeDefined();
        expect(finding.title).toBeDefined();
        expect(finding.description).toBeDefined();
        expect(finding.remediation_class).toBeDefined();
        expect(finding.remediation_hint).toBeDefined();
        expect(finding.risk).toBeDefined();
        expect(finding.estimated_scope).toBeDefined();
        expect(finding.confidence).toBeDefined();
        expect(finding.detected_at).toBeDefined();

        // Check types
        expect(["error", "warn", "info"]).toContain(finding.severity);
        expect(["mechanical", "ai", "human"]).toContain(
          finding.remediation_class,
        );
        expect(["low", "medium", "high", "critical"]).toContain(finding.risk);
        expect(["single-file", "multi-file", "cross-cutting"]).toContain(
          finding.estimated_scope,
        );
        expect(finding.confidence).toBeGreaterThanOrEqual(0);
        expect(finding.confidence).toBeLessThanOrEqual(1);
      }
    } finally {
      cleanup(testRepo);
    }
  });

  it("should complete in reasonable time", async () => {
    const testRepo = createTestRepo("performance", {
      "package.json": JSON.stringify({ name: "test" }),
    });

    try {
      const start = Date.now();
      await verify(testRepo);
      const duration = Date.now() - start;

      // Should complete quickly for small repos
      expect(duration).toBeLessThan(5000); // 5 seconds
    } finally {
      cleanup(testRepo);
    }
  });
});
