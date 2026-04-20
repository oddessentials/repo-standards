// scripts/verify-pattern-footers.test.ts

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  checkPatternReadme,
  parseKnownMetaPrincipleIds,
  verifyAllPatternReadmes,
} from "./verify-pattern-footers.js";

const EXPECTED_MP_IDS = new Set([
  "mp-adversarial-proof-required",
  "mp-churn-bait-discipline",
  "mp-committed-proof-artifacts",
  "mp-defense-in-depth",
  "mp-point-in-time-structural-claims",
  "mp-authoritative-contract-file",
  "mp-enforce-helpers-over-primitives",
  "mp-allowlist-over-blocklist",
]);

const REPO_ROOT = process.cwd();
const META_PATH = path.join(
  REPO_ROOT,
  "docs",
  "patterns",
  "meta-principles.md",
);

function validFooter(refs: string[]): string {
  const cites = refs.map((r) => `\`${r}\``).join(", ");
  return [
    "# p-fixture",
    "",
    "## Design principles this template obeys",
    "",
    `This pattern follows: ${cites} — see [Meta-Principles](../../../docs/patterns/meta-principles.md) for context.`,
    "",
  ].join("\n");
}

function stageFixture(readmes: Record<string, string | null>): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pattern-footers-"));
  fs.mkdirSync(path.join(tmp, "docs", "patterns"), { recursive: true });
  fs.copyFileSync(
    META_PATH,
    path.join(tmp, "docs", "patterns", "meta-principles.md"),
  );
  for (const [id, content] of Object.entries(readmes)) {
    const dir = path.join(tmp, "templates", "patterns", id);
    fs.mkdirSync(dir, { recursive: true });
    if (content !== null) {
      fs.writeFileSync(path.join(dir, "README.md"), content);
    }
  }
  return tmp;
}

describe("parseKnownMetaPrincipleIds — authoritative set from meta-principles.md", () => {
  it("extracts the 8 mp-* IDs declared in the doc", () => {
    const content = fs.readFileSync(META_PATH, "utf8");
    const ids = parseKnownMetaPrincipleIds(content);
    expect(ids).toEqual(EXPECTED_MP_IDS);
  });

  it("returns empty set for a doc with no mp-* headings", () => {
    const ids = parseKnownMetaPrincipleIds(
      "# Nothing\n\nSome prose without any headings.\n",
    );
    expect(ids.size).toBe(0);
  });
});

describe("checkPatternReadme — positive cases", () => {
  it("accepts a footer citing a single known principle", () => {
    const result = checkPatternReadme(
      validFooter(["mp-adversarial-proof-required"]),
      EXPECTED_MP_IDS,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.references).toEqual(["mp-adversarial-proof-required"]);
  });

  it("accepts a footer citing multiple known principles", () => {
    const result = checkPatternReadme(
      validFooter([
        "mp-adversarial-proof-required",
        "mp-defense-in-depth",
        "mp-committed-proof-artifacts",
      ]),
      EXPECTED_MP_IDS,
    );
    expect(result.valid).toBe(true);
    expect(result.references).toHaveLength(3);
  });

  it("accepts churn-bait cite when the README carries a Scope discipline anchor", () => {
    const readme = [
      "# p-example",
      "",
      "## Scope discipline",
      "",
      "This test locks canonical identifier presence only.",
      "",
      "## Design principles this template obeys",
      "",
      "Follows `mp-churn-bait-discipline`, `mp-adversarial-proof-required`.",
    ].join("\n");
    const result = checkPatternReadme(readme, EXPECTED_MP_IDS);
    expect(result.valid).toBe(true);
  });
});

describe("checkPatternReadme — adversarial: proves the gate fires", () => {
  it("rejects README with no footer section at all", () => {
    const result = checkPatternReadme(
      "# p-example\n\nBody content, nothing else.\n",
      EXPECTED_MP_IDS,
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/missing.*section/);
  });

  it("rejects footer present but citing zero mp-* principles", () => {
    const readme = [
      "# p-example",
      "",
      "## Design principles this template obeys",
      "",
      "This pattern follows best practices — see the meta-principles doc.",
    ].join("\n");
    const result = checkPatternReadme(readme, EXPECTED_MP_IDS);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/cites no mp-\* principles/);
  });

  it("rejects a typo'd mp-* ID (mp-adverserial-proof)", () => {
    const readme = validFooter(["mp-adverserial-proof"]);
    const result = checkPatternReadme(readme, EXPECTED_MP_IDS);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes(`unknown meta-principle "mp-adverserial-proof"`),
      ),
    ).toBe(true);
  });

  it("rejects mixed valid + typo'd IDs (partial invalidation still fails)", () => {
    const readme = validFooter([
      "mp-adversarial-proof-required",
      "mp-typoed-id",
    ]);
    const result = checkPatternReadme(readme, EXPECTED_MP_IDS);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("mp-typoed-id"))).toBe(true);
  });

  it("rejects churn-bait cite without a Scope discipline anchor", () => {
    const readme = validFooter(["mp-churn-bait-discipline"]);
    const result = checkPatternReadme(readme, EXPECTED_MP_IDS);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes("mp-churn-bait-discipline but README lacks"),
      ),
    ).toBe(true);
  });
});

describe("verifyAllPatternReadmes — integration over a staged tree", () => {
  it("returns valid=true with checked=0 when templates/patterns/ is absent", () => {
    const tmp = stageFixture({});
    try {
      const result = verifyAllPatternReadmes(tmp);
      expect(result.valid).toBe(true);
      expect(result.checked).toBe(0);
    } finally {
      fs.rmSync(tmp, { recursive: true });
    }
  });

  it("reports missing README.md for an orphan pattern directory", () => {
    const tmp = stageFixture({ "p-orphan": null });
    try {
      const result = verifyAllPatternReadmes(tmp);
      expect(result.valid).toBe(false);
      expect(result.perReadme[0]?.errors[0]).toMatch(/README\.md missing/);
    } finally {
      fs.rmSync(tmp, { recursive: true });
    }
  });

  it("surfaces per-README errors for a template with a typo'd mp-* ID", () => {
    const tmp = stageFixture({
      "p-typo": validFooter(["mp-adverserial-proof"]),
    });
    try {
      const result = verifyAllPatternReadmes(tmp);
      expect(result.valid).toBe(false);
      expect(
        result.perReadme[0]?.errors.some((e) =>
          e.includes("mp-adverserial-proof"),
        ),
      ).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true });
    }
  });

  it("accepts a well-formed pattern directory", () => {
    const tmp = stageFixture({
      "p-good": validFooter([
        "mp-adversarial-proof-required",
        "mp-defense-in-depth",
      ]),
    });
    try {
      const result = verifyAllPatternReadmes(tmp);
      expect(result.valid).toBe(true);
      expect(result.checked).toBe(1);
    } finally {
      fs.rmSync(tmp, { recursive: true });
    }
  });
});

describe("verifyAllPatternReadmes — always-on check against real repo", () => {
  it("passes for the actual repo (vacuous if templates/patterns/ is empty)", () => {
    const result = verifyAllPatternReadmes(REPO_ROOT);
    expect(
      result.valid,
      result.perReadme
        .map((e) => `${e.path}: ${e.errors.join("; ")}`)
        .join("\n"),
    ).toBe(true);
  });
});
