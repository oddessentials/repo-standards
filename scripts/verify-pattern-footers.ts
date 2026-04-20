// scripts/verify-pattern-footers.ts

/**
 * Validates the meta-principles footer on every pattern template README.
 *
 * Every `templates/patterns/<id>/README.md` MUST end with a section of the form:
 *
 *   ## Design principles this template obeys
 *
 *   This pattern follows: `mp-...`, `mp-...` — see
 *   [Meta-Principles](../../../docs/patterns/meta-principles.md) for context.
 *
 * The gate enforces three properties:
 *   1. The footer section is present.
 *   2. At least one `mp-*` principle is cited (no empty footers).
 *   3. Every cited `mp-*` ID exists in the authoritative set parsed from
 *      `docs/patterns/meta-principles.md` (catches typos).
 *
 * An additional structural check: any template citing `mp-churn-bait-discipline`
 * must carry a "Scope discipline" anchor somewhere in its README, since the
 * principle's whole point is preserving a narrow lock surface against
 * future-expander pressure.
 */

import fs from "node:fs";
import path from "node:path";

export interface FooterCheckResult {
  valid: boolean;
  errors: string[];
  references: string[];
}

export interface VerifyAllResult {
  valid: boolean;
  checked: number;
  perReadme: Array<{ path: string; errors: string[] }>;
}

const FOOTER_HEADING = "## Design principles this template obeys";
const MP_REFERENCE = /`(mp-[a-z0-9-]+)`/g;
const MP_HEADING = /^##\s+`(mp-[a-z0-9-]+)`/gm;
const SCOPE_DISCIPLINE_ANCHOR = /scope[\s-]discipline/i;

/**
 * Parse the canonical set of mp-* IDs from meta-principles.md itself.
 *
 * The doc is the authority for the set (mp-authoritative-contract-file):
 * adding a new principle means adding an `## \`mp-xyz\`` heading there, and
 * this gate picks it up automatically.
 */
export function parseKnownMetaPrincipleIds(docContent: string): Set<string> {
  const ids = new Set<string>();
  for (const match of docContent.matchAll(MP_HEADING)) {
    if (match[1]) ids.add(match[1]);
  }
  return ids;
}

/**
 * Check a single README against the footer contract.
 */
export function checkPatternReadme(
  readmeContent: string,
  knownMpIds: Set<string>,
): FooterCheckResult {
  const errors: string[] = [];
  const references: string[] = [];

  const footerIdx = readmeContent.indexOf(FOOTER_HEADING);
  if (footerIdx === -1) {
    errors.push(`missing "${FOOTER_HEADING}" section`);
    return { valid: false, errors, references };
  }

  const footerSection = readmeContent.slice(footerIdx);
  for (const match of footerSection.matchAll(MP_REFERENCE)) {
    if (match[1]) references.push(match[1]);
  }

  if (references.length === 0) {
    errors.push("footer present but cites no mp-* principles");
  }

  for (const ref of references) {
    if (!knownMpIds.has(ref)) {
      errors.push(
        `unknown meta-principle "${ref}" — known: ${[...knownMpIds].sort().join(", ")}`,
      );
    }
  }

  if (
    references.includes("mp-churn-bait-discipline") &&
    !SCOPE_DISCIPLINE_ANCHOR.test(readmeContent)
  ) {
    errors.push(
      'cites mp-churn-bait-discipline but README lacks a "Scope discipline" anchor',
    );
  }

  return { valid: errors.length === 0, errors, references };
}

/**
 * Walk `templates/patterns/<id>/README.md` and apply checkPatternReadme to each.
 *
 * Vacuous pass when `templates/patterns/` does not yet exist — the directory is
 * created alongside the first template.
 */
export function verifyAllPatternReadmes(repoRoot: string): VerifyAllResult {
  const metaPath = path.join(
    repoRoot,
    "docs",
    "patterns",
    "meta-principles.md",
  );
  const metaContent = fs.readFileSync(metaPath, "utf8");
  const knownMpIds = parseKnownMetaPrincipleIds(metaContent);

  const patternsDir = path.join(repoRoot, "templates", "patterns");
  const perReadme: Array<{ path: string; errors: string[] }> = [];

  if (!fs.existsSync(patternsDir)) {
    return { valid: true, checked: 0, perReadme };
  }

  const entries = fs
    .readdirSync(patternsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory());

  for (const entry of entries) {
    const readmePath = path.join(patternsDir, entry.name, "README.md");
    if (!fs.existsSync(readmePath)) {
      perReadme.push({
        path: readmePath,
        errors: [`README.md missing in templates/patterns/${entry.name}/`],
      });
      continue;
    }
    const readmeContent = fs.readFileSync(readmePath, "utf8");
    const result = checkPatternReadme(readmeContent, knownMpIds);
    if (!result.valid) {
      perReadme.push({ path: readmePath, errors: result.errors });
    }
  }

  return {
    valid: perReadme.length === 0,
    checked: entries.length,
    perReadme,
  };
}

if (
  import.meta.url.startsWith("file:") &&
  process.argv[1]?.includes("verify-pattern-footers")
) {
  const result = verifyAllPatternReadmes(process.cwd());
  if (!result.valid) {
    console.error("Pattern footer validation failed:");
    for (const entry of result.perReadme) {
      console.error(`  ${entry.path}:`);
      for (const err of entry.errors) {
        console.error(`    - ${err}`);
      }
    }
    process.exit(1);
  }
  console.log(
    `✓ Meta-principles footer valid on all ${result.checked} pattern README(s)`,
  );
}
