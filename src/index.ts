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
  return JSON.parse(readFileSync(filePath, "utf8")) as MasterJson;
}

/** Load a stack-specific checklist (optionally filtered by CI system) */
export function loadBaseline(
  stack: StackId,
  ci?: CiSystem,
): StackChecklistJson {
  const suffix = ci ? `.${ci}` : "";
  const file = `standards.${stack}${suffix}.json`;
  const filePath = join(configDir, file);
  return JSON.parse(readFileSync(filePath, "utf8")) as StackChecklistJson;
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

// ============================================================================
// Flight 20260126A: New Schema Exports
// ============================================================================

// Schema types for compliance verification
export type {
  Severity,
  RemediationClass,
  RiskLevel,
  EstimatedScope,
  Finding,
  VerifySummary,
  VerifyResult,
  SessionPhase,
  SessionOutcome,
  ExecutionResult,
  SessionLogEntry,
  SessionLog,
  GateType,
  CriterionStatus,
  Evidence,
  GateStatus,
  RequirementStatus,
  EvidenceArtifact,
  CriterionCheck,
  VictoryDeclaration,
  HumanAction,
  HumanResponse,
  FileEntry,
  InputManifest,
} from "./schemas/index.js";

// ============================================================================
// Flight 20260126A: Command Exports
// ============================================================================

// Command functions for programmatic use
export { verify, type VerifyOptions } from "./commands/verify.js";
export {
  apply,
  type ApplyOptions,
  type ApplyReport,
} from "./commands/apply.js";
export {
  doctor,
  type DoctorOptions,
  type DoctorReport,
} from "./commands/doctor.js";
export {
  migrate,
  listVersions,
  type MigrateOptions,
  type MigrationPlan,
} from "./commands/migrate.js";

// ============================================================================
// Flight 20260126A: Core Utility Exports
// ============================================================================

// Core utilities for advanced use cases
export {
  loadStandardsConfig,
  type StandardsConfig,
  type PackConfig,
} from "./core/config-loader.js";

export { scanRepository, computeFileHash } from "./core/file-scanner.js";
export { computeInputHash } from "./core/input-hash.js";
export {
  evaluateRules,
  type RuleEvaluationResult,
} from "./core/rule-engine.js";

// ============================================================================
// Flight 20260126A: Session Management Exports
// ============================================================================

// Session management for orchestration
export {
  SessionStateMachine,
  type StateTransition,
} from "./session/state-machine.js";

export {
  AuditLogger,
  type AuditLoggerOptions,
} from "./session/audit-logger.js";

export {
  SessionManager,
  type SessionManagerOptions,
} from "./session/session-manager.js";

// ============================================================================
// Flight 20260126A: Gate Exports
// ============================================================================

// Entry gates
export {
  evaluateEG01,
  evaluateEG02,
  evaluateEG03,
} from "./gates/entry-gates.js";

// Phase gates
export {
  evaluatePG01,
  evaluatePG02,
  evaluatePG03,
  evaluatePG04,
  evaluatePG05,
} from "./gates/phase-gates.js";

// Exit gates
export {
  evaluateXG01,
  evaluateXG02,
  evaluateXG03,
  evaluateXG04,
} from "./gates/exit-gates.js";

// Remediation gates
export {
  evaluateRSG01,
  evaluateRSG02,
  evaluateRSG03,
} from "./gates/remediation-gates.js";

// Victory gates
export {
  evaluateVG001,
  evaluateVG002,
  evaluateVG003,
  evaluateVG004,
  evaluateVG005,
  evaluateVGR01,
  evaluateVGR02,
  evaluateVGR03,
} from "./gates/victory-gates.js";
