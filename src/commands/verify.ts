// src/commands/verify.ts
// Verify command - evaluate repository compliance against declared standards

import { resolve } from "node:path";
import type {
  VerifyResult,
  VerifySummary,
  Severity,
  Tier,
  RemediationClass,
} from "../schemas/index.js";
import { loadStandardsConfig } from "../core/config-loader.js";
import { scanRepository } from "../core/file-scanner.js";
import { computeInputHash } from "../core/input-hash.js";
import { evaluateRules } from "../core/rule-engine.js";
import { STANDARDS_VERSION } from "../version.js";

/**
 * Options for the verify command.
 */
export interface VerifyOptions {
  /** Session ID to link this verification to (optional) */
  session_id?: string;

  /** Output format (default: "json") */
  format?: "json" | "summary";
}

/**
 * Verify repository compliance against declared standards.
 *
 * This command is deterministic: same inputs produce same outputs.
 * No network access is performed during verification.
 *
 * @param path - Path to the repository to verify
 * @param options - Verification options
 * @returns VerifyResult with compliance status and findings
 */
export async function verify(
  path: string,
  options: VerifyOptions = {},
): Promise<VerifyResult> {
  const startTime = Date.now();
  const repoPath = resolve(path);

  // Load configuration
  const config = loadStandardsConfig(repoPath);

  // Scan repository files
  const manifestWithoutHash = scanRepository(repoPath, config);

  // Compute deterministic input hash
  const input_hash = computeInputHash(manifestWithoutHash);

  // Evaluate rules
  const evaluation = evaluateRules(repoPath, config, manifestWithoutHash);

  // Build summary
  const summary: VerifySummary = {
    total: evaluation.findings.length,
    by_severity: {
      error: 0,
      warn: 0,
      info: 0,
    },
    by_remediation_class: {
      mechanical: 0,
      ai: 0,
      human: 0,
    },
    by_tier: {
      core: 0,
      recommended: 0,
      optional: 0,
    },
  };

  for (const finding of evaluation.findings) {
    summary.by_severity[finding.severity as Severity]++;
    summary.by_remediation_class[
      finding.remediation_class as RemediationClass
    ]++;
    summary.by_tier[finding.tier as Tier]++;
  }

  // Determine compliance (no error-severity findings)
  const is_compliant = summary.by_severity.error === 0;

  const result: VerifyResult = {
    schema_version: "1.1.0",
    session_id: options.session_id,
    input_hash,
    verified_at: new Date().toISOString(),
    is_compliant,
    standards_version: config.version || STANDARDS_VERSION,
    stack_id: config.stack,
    findings: evaluation.findings,
    not_applicable: evaluation.not_applicable,
    summary,
    repository_path: repoPath,
    execution_time_ms: Date.now() - startTime,
  };

  return result;
}
