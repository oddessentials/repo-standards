import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import type {
  MasterJson,
  StackChecklistJson,
  StackId,
  CiSystem,
} from "./types.js";
import { STANDARDS_VERSION, STANDARDS_SCHEMA_VERSION } from "./version.js";

// Re-export types for consumers
export type { MasterJson, StackChecklistJson, StackId, CiSystem };

// Re-export version info (stable API contract)
export { STANDARDS_VERSION, STANDARDS_SCHEMA_VERSION };

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to config directory:
// - When running from src/ (dev/test): use repo root config/
// - When running from dist/ (installed): use dist/config/
const isDevMode = __dirname.includes("src");
const configDir = isDevMode
  ? join(__dirname, "..", "config")
  : join(__dirname, "config");

/** Load the master spec JSON from the packaged dist directory */
export function loadMasterSpec(): MasterJson {
  const filePath = join(configDir, "standards.json");
  return JSON.parse(readFileSync(filePath, "utf8"));
}

/** Load a stack-specific checklist (optionally filtered by CI system) */
export function loadBaseline(
  stack: StackId,
  ci?: CiSystem,
): StackChecklistJson {
  const suffix = ci ? `.${ci}` : "";
  const file = `standards.${stack}${suffix}.json`;
  const filePath = join(configDir, file);
  return JSON.parse(readFileSync(filePath, "utf8"));
}

/** List all supported stacks (derived from the master spec) */
export function listSupportedStacks(): readonly StackId[] {
  const spec = loadMasterSpec();
  return Object.keys(spec.stacks) as StackId[];
}

/** List all supported CI systems (derived from the master spec) */
export function listSupportedCiSystems(): readonly CiSystem[] {
  const spec = loadMasterSpec();
  return spec.ciSystems as CiSystem[];
}

/**
 * PUBLIC API CONTRACT (semver-governed)
 * Alias for loadBaseline - loads stack-specific standards checklist.
 * Breaking changes to this function signature require a major version bump.
 */
export function getStandards(
  stack: StackId,
  ci?: CiSystem,
): StackChecklistJson {
  return loadBaseline(stack, ci);
}

/**
 * PUBLIC API CONTRACT (semver-governed)
 * Alias for loadMasterSpec - loads the master standards schema.
 * Breaking changes to this function signature require a major version bump.
 */
export function getSchema(): MasterJson {
  return loadMasterSpec();
}
