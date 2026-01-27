// src/commands/migrate.ts
// Migrate command - assist with standards version upgrades

import { STANDARDS_VERSION } from "../version.js";

/**
 * Options for the migrate command.
 */
export interface MigrateOptions {
  /** Path to the repository (optional) */
  path?: string;
}

/**
 * A breaking change between versions.
 */
export interface BreakingChange {
  /** Change identifier */
  id: string;

  /** Description of the change */
  description: string;

  /** Affected rules or configurations */
  affected: string[];

  /** Migration action required */
  action: string;

  /** Severity of the change */
  severity: "low" | "medium" | "high";
}

/**
 * A migration step.
 */
export interface MigrationStep {
  /** Step number */
  step: number;

  /** Step title */
  title: string;

  /** Detailed description */
  description: string;

  /** Whether this step is required */
  required: boolean;

  /** Affected files */
  affected_files?: string[];
}

/**
 * Result of the migrate command.
 */
export interface MigrationPlan {
  /** Source version */
  from_version: string;

  /** Target version */
  to_version: string;

  /** Whether migration is possible */
  can_migrate: boolean;

  /** Breaking changes between versions */
  breaking_changes: BreakingChange[];

  /** Migration steps */
  steps: MigrationStep[];

  /** Summary of the migration */
  summary: string;

  /** When the plan was generated (ISO 8601 UTC) */
  generated_at: string;
}

/**
 * Known breaking changes between versions.
 */
const BREAKING_CHANGES: Record<string, BreakingChange[]> = {
  "6.0.0-7.0.0": [
    {
      id: "BC-001",
      description: "Coverage threshold changed from percentage to ratio",
      affected: ["meta.defaultCoverageThreshold"],
      action: "Divide existing threshold by 100 (e.g., 80 becomes 0.8)",
      severity: "high",
    },
    {
      id: "BC-002",
      description: "Bazel hints moved to executorHints.bazel",
      affected: ["stackHints.*.bazelHints"],
      action: "Move bazelHints to the new location in standards.json",
      severity: "medium",
    },
  ],
  "5.0.0-6.0.0": [
    {
      id: "BC-003",
      description: "Enforcement levels introduced",
      affected: ["checklist.*.enforcement"],
      action: "Add enforcement level to all checklist items",
      severity: "medium",
    },
  ],
};

/**
 * Get migration steps between versions.
 */
function getMigrationSteps(from: string, to: string): MigrationStep[] {
  const steps: MigrationStep[] = [];
  let stepNum = 1;

  // Always recommend backup
  steps.push({
    step: stepNum++,
    title: "Backup current configuration",
    description:
      "Create a backup of your .odd/standards.toml and any custom configurations",
    required: true,
    affected_files: [".odd/standards.toml"],
  });

  // Version-specific steps
  const changeKey = `${from}-${to}`;
  const changes = BREAKING_CHANGES[changeKey] || [];

  for (const change of changes) {
    steps.push({
      step: stepNum++,
      title: `Address: ${change.id}`,
      description: `${change.description}\n\nAction: ${change.action}`,
      required: change.severity === "high",
      affected_files: change.affected,
    });
  }

  // Update version
  steps.push({
    step: stepNum++,
    title: "Update standards version",
    description: `Update version in .odd/standards.toml from "${from}" to "${to}"`,
    required: true,
    affected_files: [".odd/standards.toml"],
  });

  // Run verify
  steps.push({
    step: stepNum++,
    title: "Verify compliance",
    description: "Run `repo-standards verify .` to check for new issues",
    required: true,
  });

  return steps;
}

/**
 * Check if a version is valid.
 */
function isValidVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

/**
 * Compare semver versions.
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    const partA = partsA[i] ?? 0;
    const partB = partsB[i] ?? 0;
    if (partA > partB) return 1;
    if (partA < partB) return -1;
  }
  return 0;
}

/**
 * Generate a migration plan between standards versions.
 *
 * @param fromVersion - Source version
 * @param toVersion - Target version
 * @param options - Migrate options
 * @returns Migration plan
 */
export async function migrate(
  fromVersion: string,
  toVersion: string,
  _options: MigrateOptions = {},
): Promise<MigrationPlan> {
  // Validate versions
  if (!isValidVersion(fromVersion)) {
    return {
      from_version: fromVersion,
      to_version: toVersion,
      can_migrate: false,
      breaking_changes: [],
      steps: [],
      summary: `Invalid source version: ${fromVersion}. Expected format: X.Y.Z`,
      generated_at: new Date().toISOString(),
    };
  }

  if (!isValidVersion(toVersion)) {
    return {
      from_version: fromVersion,
      to_version: toVersion,
      can_migrate: false,
      breaking_changes: [],
      steps: [],
      summary: `Invalid target version: ${toVersion}. Expected format: X.Y.Z`,
      generated_at: new Date().toISOString(),
    };
  }

  // Check version ordering
  const comparison = compareVersions(fromVersion, toVersion);
  if (comparison === 0) {
    return {
      from_version: fromVersion,
      to_version: toVersion,
      can_migrate: true,
      breaking_changes: [],
      steps: [],
      summary: "Already at target version. No migration needed.",
      generated_at: new Date().toISOString(),
    };
  }

  if (comparison > 0) {
    return {
      from_version: fromVersion,
      to_version: toVersion,
      can_migrate: false,
      breaking_changes: [],
      steps: [],
      summary: `Downgrade from ${fromVersion} to ${toVersion} is not supported.`,
      generated_at: new Date().toISOString(),
    };
  }

  // Get breaking changes
  const changeKey = `${fromVersion}-${toVersion}`;
  const breaking_changes = BREAKING_CHANGES[changeKey] || [];

  // Get migration steps
  const steps = getMigrationSteps(fromVersion, toVersion);

  // Generate summary
  const highSeverity = breaking_changes.filter(
    (c) => c.severity === "high",
  ).length;
  let summary: string;
  if (breaking_changes.length === 0) {
    summary = `Migration from ${fromVersion} to ${toVersion} has no breaking changes.`;
  } else if (highSeverity > 0) {
    summary = `Migration from ${fromVersion} to ${toVersion} has ${breaking_changes.length} breaking change(s), ${highSeverity} high severity.`;
  } else {
    summary = `Migration from ${fromVersion} to ${toVersion} has ${breaking_changes.length} breaking change(s).`;
  }

  return {
    from_version: fromVersion,
    to_version: toVersion,
    can_migrate: true,
    breaking_changes,
    steps,
    summary,
    generated_at: new Date().toISOString(),
  };
}

/**
 * List all available standards versions.
 */
export function listVersions(): string[] {
  return ["5.0.0", "6.0.0", "7.0.0", STANDARDS_VERSION];
}
