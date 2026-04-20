// src/core/conditions.ts
// Repository-state predicates used by the rule engine to decide whether a
// conditional checklist item applies. Items opt in via `conditions: ["..."]`.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { InputManifest } from "../schemas/index.js";

/**
 * Known conditions recognized by the rule engine. Items reference these by
 * name via the `conditions` field on a ChecklistItem. Conditions combine
 * with AND semantics: an item applies only if *every* listed condition is
 * true.
 *
 * To add a condition:
 *   1. Add the name here.
 *   2. Implement a detector in DETECTORS below.
 *   3. Document the detection heuristic in the JSDoc above that detector.
 *
 * Unknown condition names always evaluate to false (items referencing them
 * will always render as N/A). This is intentional: typos fail loud.
 */
export const KNOWN_CONDITIONS = ["has-database", "has-cli"] as const;

export type ConditionName = (typeof KNOWN_CONDITIONS)[number];

type ConditionDetector = (
  repoPath: string,
  manifest: Omit<InputManifest, "input_hash">,
) => boolean;

function anyFileExists(
  repoPath: string,
  manifest: Omit<InputManifest, "input_hash">,
  candidates: string[],
): boolean {
  for (const file of candidates) {
    const normalized = file.replace(/\\/g, "/");
    if (manifest.files.some((f) => f.path === normalized)) return true;
    if (existsSync(join(repoPath, file))) return true;
  }
  return false;
}

function hasDirectory(
  manifest: Omit<InputManifest, "input_hash">,
  prefix: string,
): boolean {
  const normalized = prefix.replace(/\\/g, "/").replace(/\/$/, "") + "/";
  return manifest.files.some((f) => f.path.startsWith(normalized));
}

function packageJsonHasBin(repoPath: string): boolean {
  const packageJsonPath = join(repoPath, "package.json");
  if (!existsSync(packageJsonPath)) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const bin = pkg.bin as unknown;
    if (typeof bin === "string" && bin.length > 0) return true;
    if (
      typeof bin === "object" &&
      bin !== null &&
      Object.keys(bin).length > 0
    ) {
      return true;
    }
  } catch {
    // Malformed package.json — treat as no bin.
  }
  return false;
}

/**
 * has-database: true when the repo ships a relational schema with migrations.
 * Heuristics (any one suffices):
 *   - a `migrations/` directory (any stack)
 *   - a `db/migrate/` directory (Rails / similar)
 *   - `alembic.ini` (Python / SQLAlchemy)
 *   - `prisma/schema.prisma` (Prisma)
 *   - `drizzle.config.{ts,js,json}` (Drizzle)
 *   - `knexfile.{js,ts,cjs}` (Knex)
 */
const detectHasDatabase: ConditionDetector = (repoPath, manifest) => {
  if (hasDirectory(manifest, "migrations")) return true;
  if (hasDirectory(manifest, "db/migrate")) return true;
  return anyFileExists(repoPath, manifest, [
    "alembic.ini",
    "prisma/schema.prisma",
    "drizzle.config.ts",
    "drizzle.config.js",
    "drizzle.config.json",
    "knexfile.js",
    "knexfile.ts",
    "knexfile.cjs",
  ]);
};

/**
 * has-cli: true when the repo ships a command-line entrypoint.
 * Heuristics (any one suffices):
 *   - `package.json` has a non-empty `bin` field (Node)
 *   - a `src/cli.{ts,js,py}` file (common convention)
 *   - a top-level `cli/` or `cmd/` directory
 */
const detectHasCli: ConditionDetector = (repoPath, manifest) => {
  if (packageJsonHasBin(repoPath)) return true;
  if (
    anyFileExists(repoPath, manifest, [
      "src/cli.ts",
      "src/cli.js",
      "src/cli.py",
      "src/cli.mjs",
      "src/cli.cjs",
    ])
  ) {
    return true;
  }
  if (hasDirectory(manifest, "cli")) return true;
  if (hasDirectory(manifest, "cmd")) return true;
  return false;
};

const DETECTORS: Record<ConditionName, ConditionDetector> = {
  "has-database": detectHasDatabase,
  "has-cli": detectHasCli,
};

/**
 * Evaluate all known conditions against a repository.
 *
 * Precedence: if a condition name appears in `overrides`, its value is used
 * as-is regardless of detection. Otherwise the detector runs. Unknown
 * condition names are not evaluated here (they will read `false` from the
 * returned record because the key is absent).
 */
export function evaluateConditions(
  repoPath: string,
  manifest: Omit<InputManifest, "input_hash">,
  overrides?: Record<string, boolean>,
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const name of KNOWN_CONDITIONS) {
    if (overrides && name in overrides) {
      result[name] = Boolean(overrides[name]);
    } else {
      result[name] = DETECTORS[name](repoPath, manifest);
    }
  }
  return result;
}

/**
 * Given an item's `conditions` list and the evaluated condition map, return
 * the name of the first unmet condition, or null if all conditions hold.
 * Unknown conditions (not in the evaluated map) are treated as unmet.
 */
export function firstUnmetCondition(
  itemConditions: string[] | undefined,
  evaluated: Record<string, boolean>,
): string | null {
  if (!itemConditions || itemConditions.length === 0) return null;
  for (const cond of itemConditions) {
    if (!evaluated[cond]) return cond;
  }
  return null;
}
