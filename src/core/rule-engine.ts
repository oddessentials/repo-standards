// src/core/rule-engine.ts
// Standards rule evaluation engine

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { v4 as uuidv4 } from "uuid";
import type {
  Finding,
  Severity,
  Tier,
  RemediationClass,
  RiskLevel,
  EstimatedScope,
  NotApplicableEntry,
} from "../schemas/index.js";
import type { InputManifest } from "../schemas/index.js";
import type { StandardsConfig } from "./config-loader.js";
import type { ChecklistItem, StackHints } from "../types.js";
// Import from internal module to avoid circular dependency with index.ts
import { loadBaseline } from "../internal/baseline-loader.js";
import { evaluateConditions, firstUnmetCondition } from "./conditions.js";

/**
 * Result of rule evaluation.
 */
export interface RuleEvaluationResult {
  /** All findings from evaluation */
  findings: Finding[];

  /** Number of rules evaluated */
  rules_evaluated: number;

  /** Number of rules passed */
  rules_passed: number;

  /** Number of rules failed */
  rules_failed: number;

  /**
   * Items skipped because at least one declared condition was unmet.
   * Always present (empty array when no items were skipped).
   */
  not_applicable: NotApplicableEntry[];
}

/**
 * Map enforcement level to severity.
 */
function enforcementToSeverity(enforcement?: string): Severity {
  switch (enforcement) {
    case "required":
      return "error";
    case "recommended":
      return "warn";
    case "optional":
      return "info";
    default:
      return "error";
  }
}

/**
 * Determine remediation class based on rule characteristics.
 */
function determineRemediationClass(
  _item: ChecklistItem,
  hints?: StackHints,
): RemediationClass {
  // If there are required files, it's often mechanical
  if (hints?.requiredFiles?.length || hints?.anyOfFiles?.length) {
    return "mechanical";
  }

  // If it requires configuration changes, might need AI
  if (hints?.exampleConfigFiles?.length) {
    return "ai";
  }

  // Default to AI for complex items
  return "ai";
}

/**
 * Determine risk level based on severity and scope.
 */
function determineRiskLevel(
  severity: Severity,
  scope: EstimatedScope,
): RiskLevel {
  if (severity === "error") {
    return scope === "cross-cutting" ? "critical" : "high";
  }
  if (severity === "warn") {
    return scope === "single-file" ? "low" : "medium";
  }
  return "low";
}

/**
 * Check if required files exist.
 */
function checkRequiredFiles(
  repoPath: string,
  requiredFiles: string[],
  manifest: Omit<InputManifest, "input_hash">,
): string[] {
  const missing: string[] = [];

  for (const file of requiredFiles) {
    const normalizedFile = file.replace(/\\/g, "/");
    const exists = manifest.files.some((f) => f.path === normalizedFile);

    if (!exists) {
      // Double-check with filesystem (in case manifest is stale)
      if (!existsSync(join(repoPath, file))) {
        missing.push(file);
      }
    }
  }

  return missing;
}

/**
 * Check if any of the specified files exist.
 */
function checkAnyOfFiles(
  repoPath: string,
  anyOfFiles: string[],
  manifest: Omit<InputManifest, "input_hash">,
): boolean {
  for (const file of anyOfFiles) {
    const normalizedFile = file.replace(/\\/g, "/");
    const exists = manifest.files.some((f) => f.path === normalizedFile);

    if (exists || existsSync(join(repoPath, file))) {
      return true;
    }
  }

  return false;
}

/**
 * Check if required scripts exist in package.json.
 */
function checkRequiredScripts(
  repoPath: string,
  requiredScripts: string[],
): string[] {
  const packageJsonPath = join(repoPath, "package.json");
  const missing: string[] = [];

  if (!existsSync(packageJsonPath)) {
    return requiredScripts; // All missing if no package.json
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const scripts = packageJson.scripts || {};

    for (const script of requiredScripts) {
      if (!(script in scripts)) {
        missing.push(script);
      }
    }
  } catch {
    return requiredScripts; // All missing if can't parse
  }

  return missing;
}

/**
 * Evaluate a single checklist item.
 */
function evaluateItem(
  item: ChecklistItem,
  tier: Tier,
  repoPath: string,
  config: StandardsConfig,
  manifest: Omit<InputManifest, "input_hash">,
): Finding | null {
  const hints = item.stackHints?.[config.stack];

  // Check required files
  if (hints?.requiredFiles?.length) {
    const missing = checkRequiredFiles(repoPath, hints.requiredFiles, manifest);
    if (missing.length > 0) {
      const severity = enforcementToSeverity(item.enforcement);
      const scope: EstimatedScope =
        missing.length === 1 ? "single-file" : "multi-file";

      return {
        finding_id: uuidv4(),
        rule_id: item.id,
        severity,
        tier,
        title: `Missing required file(s): ${item.label}`,
        description: `${item.description}\n\nMissing files: ${missing.join(", ")}`,
        remediation_class: "mechanical",
        remediation_hint: `Create the following file(s): ${missing.join(", ")}`,
        risk: determineRiskLevel(severity, scope),
        estimated_scope: scope,
        confidence: 1.0,
        detected_at: new Date().toISOString(),
      };
    }
  }

  // Check anyOf files
  if (hints?.anyOfFiles?.length) {
    const hasAny = checkAnyOfFiles(repoPath, hints.anyOfFiles, manifest);
    if (!hasAny) {
      const severity = enforcementToSeverity(item.enforcement);

      return {
        finding_id: uuidv4(),
        rule_id: item.id,
        severity,
        tier,
        title: `Missing configuration: ${item.label}`,
        description: `${item.description}\n\nExpected one of: ${hints.anyOfFiles.join(", ")}`,
        remediation_class: determineRemediationClass(item, hints),
        remediation_hint: `Create one of the following: ${hints.anyOfFiles.join(", ")}`,
        risk: determineRiskLevel(severity, "single-file"),
        estimated_scope: "single-file",
        confidence: 1.0,
        detected_at: new Date().toISOString(),
      };
    }
  }

  // Check required scripts
  if (hints?.requiredScripts?.length) {
    const missing = checkRequiredScripts(repoPath, hints.requiredScripts);
    if (missing.length > 0) {
      const severity = enforcementToSeverity(item.enforcement);

      return {
        finding_id: uuidv4(),
        rule_id: item.id,
        severity,
        tier,
        title: `Missing npm scripts: ${item.label}`,
        description: `${item.description}\n\nMissing scripts: ${missing.join(", ")}`,
        file_path: "package.json",
        remediation_class: "mechanical",
        remediation_hint: `Add the following scripts to package.json: ${missing.join(", ")}`,
        risk: determineRiskLevel(severity, "single-file"),
        estimated_scope: "single-file",
        confidence: 1.0,
        detected_at: new Date().toISOString(),
      };
    }
  }

  // Item passes if we get here
  return null;
}

/**
 * Evaluate all standards rules against the repository.
 *
 * @param repoPath - Absolute path to the repository
 * @param config - Standards configuration
 * @param manifest - Input manifest
 * @returns Evaluation results with findings
 */
export function evaluateRules(
  repoPath: string,
  config: StandardsConfig,
  manifest: Omit<InputManifest, "input_hash">,
): RuleEvaluationResult {
  const findings: Finding[] = [];
  const not_applicable: NotApplicableEntry[] = [];
  let rules_evaluated = 0;
  let rules_passed = 0;
  let rules_failed = 0;

  // Load standards for the configured stack
  const standards = loadBaseline(config.stack, config.ci_system);

  // Evaluate known conditions once for the whole run. Consumer overrides
  // in config.conditions take precedence over auto-detection.
  const conditionStates = evaluateConditions(
    repoPath,
    manifest,
    config.conditions,
  );

  // Evaluate all checklist items, preserving tier from array placement
  const allItems: Array<{ item: ChecklistItem; tier: Tier }> = [
    ...standards.checklist.core.map((item) => ({
      item,
      tier: "core" as const,
    })),
    ...standards.checklist.recommended.map((item) => ({
      item,
      tier: "recommended" as const,
    })),
    ...standards.checklist.optionalEnhancements.map((item) => ({
      item,
      tier: "optional" as const,
    })),
  ];

  for (const { item, tier } of allItems) {
    // Check if item applies to this stack
    // If appliesTo.stacks is defined, the stack must be in the list
    // If appliesTo.stacks is undefined, item applies to all stacks
    if (
      item.appliesTo?.stacks &&
      !item.appliesTo.stacks.includes(config.stack)
    ) {
      continue;
    }

    // Check if item applies to this CI system
    // If appliesTo.ciSystems is defined, the CI system must be in the list
    // If appliesTo.ciSystems is undefined, item applies to all CI systems
    if (
      config.ci_system &&
      item.appliesTo?.ciSystems &&
      !item.appliesTo.ciSystems.includes(config.ci_system)
    ) {
      continue;
    }

    // Check declared conditions. Items whose conditions are unmet are
    // recorded as not-applicable rather than evaluated as failing.
    const unmet = firstUnmetCondition(item.conditions, conditionStates);
    if (unmet !== null) {
      not_applicable.push({
        rule_id: item.id,
        tier,
        unmet_condition: unmet,
      });
      continue;
    }

    rules_evaluated++;

    const finding = evaluateItem(item, tier, repoPath, config, manifest);
    if (finding) {
      findings.push(finding);
      rules_failed++;
    } else {
      rules_passed++;
    }
  }

  return {
    findings,
    rules_evaluated,
    rules_passed,
    rules_failed,
    not_applicable,
  };
}
