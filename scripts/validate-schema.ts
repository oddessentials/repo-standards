// scripts/validate-schema.ts
// Validates standards.json against JSON Schema and performs additional semantic checks

import Ajv, { ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import stableStringify from "fast-json-stable-stringify";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const configPath = path.join(rootDir, "config", "standards.json");
const schemaPath = path.join(rootDir, "config", "standards.schema.json");
const readmePath = path.join(rootDir, "README.md");

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface ChecklistItem {
  id: string;
  executionStage?: string;
  appliesTo?: { stacks?: string[]; ciSystems?: string[] };
  ciHints?: Record<string, unknown>;
  stackHints?: Record<string, unknown>;
}

const VALID_EXECUTION_STAGES = new Set([
  "pre-commit",
  "pre-push",
  "ci-pr",
  "ci-main",
  "release",
  "nightly",
]);

interface MigrationStep {
  focusIds?: string[];
}

interface Config {
  version: number;
  ciSystems: string[];
  stacks: Record<string, unknown>;
  meta?: {
    defaultCoverageThreshold?: number;
    coverageThresholdUnit?: string;
    migrationGuide?: MigrationStep[];
  };
  checklist: {
    core: ChecklistItem[];
    recommended: ChecklistItem[];
    optionalEnhancements: ChecklistItem[];
  };
}

/**
 * Validate README schema version references match standards.json version
 */
function validateReadmeSchemaVersion(
  config: Config,
  readmeRaw?: string,
): ValidationResult {
  if (!readmeRaw) {
    return {
      valid: false,
      errors: ["README.md not provided for version consistency check"],
    };
  }

  const errors: string[] = [];
  const actualVersion = config.version;

  const currentMatch = readmeRaw.match(/version.*\(currently `(\d+)`\)/i);
  if (!currentMatch) {
    errors.push("README.md missing current schema version reference");
  } else if (Number(currentMatch[1]) !== actualVersion) {
    errors.push(
      `README.md current schema version (${currentMatch[1]}) does not match standards.json (${actualVersion})`,
    );
  }

  const listPattern = new RegExp(`-\\s*\`${actualVersion}\`\\s*—`);
  if (!listPattern.test(readmeRaw)) {
    errors.push(
      `README.md schema version list does not include current version ${actualVersion}`,
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate config against JSON Schema using Ajv
 */
function validateSchema(config: unknown, schema: unknown): ValidationResult {
  const ajv = new Ajv.default({ allErrors: true, strict: true });
  addFormats.default(ajv);

  const validate = ajv.compile(schema as object);
  const valid = validate(config);

  if (!valid && validate.errors) {
    return {
      valid: false,
      errors: validate.errors.map(
        (e: ErrorObject) =>
          `${e.instancePath || "/"}: ${e.message} (${JSON.stringify(e.params)})`,
      ),
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate that all checklist IDs are unique across all sections
 */
function validateUniqueIds(config: Config): ValidationResult {
  const allItems = [
    ...config.checklist.core,
    ...config.checklist.recommended,
    ...config.checklist.optionalEnhancements,
  ];

  const ids = allItems.map((item) => item.id);
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.push(id);
    }
    seen.add(id);
  }

  if (duplicates.length > 0) {
    return {
      valid: false,
      errors: [`Duplicate checklist IDs found: ${duplicates.join(", ")}`],
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate that migrationGuide focusIds reference existing checklist IDs
 */
function validateFocusIdReferences(config: Config): ValidationResult {
  const allIds = new Set([
    ...config.checklist.core.map((i) => i.id),
    ...config.checklist.recommended.map((i) => i.id),
    ...config.checklist.optionalEnhancements.map((i) => i.id),
  ]);

  const errors: string[] = [];
  const migrationGuide = config.meta?.migrationGuide ?? [];

  for (const step of migrationGuide) {
    for (const focusId of step.focusIds ?? []) {
      if (!allIds.has(focusId)) {
        errors.push(
          `migrationGuide focusId "${focusId}" does not reference a valid checklist ID`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate that appliesTo.stacks only references known stack keys
 */
function validateStackReferences(config: Config): ValidationResult {
  const validStacks = new Set(Object.keys(config.stacks));
  const errors: string[] = [];

  const allItems = [
    ...config.checklist.core,
    ...config.checklist.recommended,
    ...config.checklist.optionalEnhancements,
  ];

  for (const item of allItems) {
    for (const stack of item.appliesTo?.stacks ?? []) {
      if (!validStacks.has(stack)) {
        errors.push(
          `Item "${item.id}" references unknown stack "${stack}" in appliesTo.stacks`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate that ciHints keys are a subset of ciSystems
 */
function validateCiHintKeys(config: Config): ValidationResult {
  const validCiSystems = new Set(config.ciSystems);
  const errors: string[] = [];

  const allItems = [
    ...config.checklist.core,
    ...config.checklist.recommended,
    ...config.checklist.optionalEnhancements,
  ];

  for (const item of allItems) {
    for (const ciKey of Object.keys(item.ciHints ?? {})) {
      if (!validCiSystems.has(ciKey)) {
        errors.push(
          `Item "${item.id}" has ciHints key "${ciKey}" not in ciSystems`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate coverage threshold semantics: if unit is "ratio", threshold must be 0-1
 */
function validateCoverageThreshold(config: Config): ValidationResult {
  const threshold = config.meta?.defaultCoverageThreshold;
  const unit = config.meta?.coverageThresholdUnit;

  if (unit === "ratio" && threshold !== undefined) {
    if (threshold < 0 || threshold > 1) {
      return {
        valid: false,
        errors: [
          `defaultCoverageThreshold is ${threshold} but coverageThresholdUnit is "ratio" (must be 0-1)`,
        ],
      };
    }
  }

  return { valid: true, errors: [] };
}

/**
 * Validate executionStage coverage - all items should have a valid executionStage
 */
function validateExecutionStageCoverage(config: Config): ValidationResult {
  const allItems = [
    ...config.checklist.core,
    ...config.checklist.recommended,
    ...config.checklist.optionalEnhancements,
  ];

  const errors: string[] = [];
  const stageCounts: Record<string, number> = {};

  for (const item of allItems) {
    if (!item.executionStage) {
      errors.push(`Item "${item.id}" is missing executionStage`);
    } else if (!VALID_EXECUTION_STAGES.has(item.executionStage)) {
      errors.push(
        `Item "${item.id}" has invalid executionStage "${item.executionStage}"`,
      );
    } else {
      stageCounts[item.executionStage] =
        (stageCounts[item.executionStage] ?? 0) + 1;
    }
  }

  // Log stage distribution (informational, not an error)
  if (errors.length === 0 && Object.keys(stageCounts).length > 0) {
    // This is just for debugging, not shown in normal output
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Generate a normalized, deterministic string representation of the config.
 * Uses deep stable key ordering at all depths.
 */
export function normalizeConfig(config: unknown): string {
  return stableStringify(config);
}

/**
 * Run all validations and return combined result
 */
export function validateStandardsConfig(
  configRaw: string,
  schemaRaw: string,
  readmeRaw?: string,
): ValidationResult {
  let config: Config;
  let schema: unknown;

  try {
    config = JSON.parse(configRaw);
  } catch {
    return { valid: false, errors: ["Failed to parse standards.json as JSON"] };
  }

  try {
    schema = JSON.parse(schemaRaw);
  } catch {
    return {
      valid: false,
      errors: ["Failed to parse standards.schema.json as JSON"],
    };
  }

  const results: ValidationResult[] = [
    validateSchema(config, schema),
    validateUniqueIds(config),
    validateFocusIdReferences(config),
    validateStackReferences(config),
    validateCiHintKeys(config),
    validateCoverageThreshold(config),
    validateExecutionStageCoverage(config),
    validateReadmeSchemaVersion(config, readmeRaw),
  ];

  const allErrors = results.flatMap((r) => r.errors);
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Main entry point for CLI usage
 */
export function validateStandardsSchema(): void {
  if (!fs.existsSync(configPath)) {
    console.error(`Config file not found: ${configPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(schemaPath)) {
    console.error(`Schema file not found: ${schemaPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(readmePath)) {
    console.error(`README file not found: ${readmePath}`);
    process.exit(1);
  }

  const configRaw = fs.readFileSync(configPath, "utf8");
  const schemaRaw = fs.readFileSync(schemaPath, "utf8");
  const readmeRaw = fs.readFileSync(readmePath, "utf8");

  const result = validateStandardsConfig(configRaw, schemaRaw, readmeRaw);

  if (!result.valid) {
    console.error("Schema validation failed:");
    for (const error of result.errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log("✓ Schema validation passed");
  console.log("✓ All checklist IDs are unique");
  console.log("✓ All migrationGuide focusIds reference valid IDs");
  console.log("✓ All appliesTo.stacks reference valid stack keys");
  console.log("✓ All ciHints keys are valid ciSystems");
  console.log("✓ Coverage threshold semantics are valid");
  console.log("✓ All items have valid executionStage");
  console.log("✓ README schema version references are aligned");
}

// CLI entry point
if (
  import.meta.url.startsWith("file:") &&
  process.argv[1]?.includes("validate-schema")
) {
  validateStandardsSchema();
}
