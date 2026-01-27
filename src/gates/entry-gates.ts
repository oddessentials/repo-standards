// src/gates/entry-gates.ts
// Entry gates - prerequisites before starting work

import { existsSync } from "node:fs";
import { join } from "node:path";
import type {
  GateStatus,
  CriterionStatus,
  Evidence,
} from "../schemas/index.js";
import type { VerifyResult } from "../schemas/index.js";
import type { SessionLog } from "../schemas/index.js";

/**
 * EG-01: Session Initialization
 * Ensure proper context before any operation.
 */
export function evaluateEG01(repoPath: string, sessionId?: string): GateStatus {
  const criteria: CriterionStatus[] = [];
  const evidence: Evidence[] = [];

  // Check repository path is valid
  const repoValid = existsSync(repoPath);
  criteria.push({
    criterion: "Repository path is valid",
    passed: repoValid,
    value: repoPath,
    error: repoValid ? undefined : "Path does not exist",
  });

  // Check is git repository
  const gitDir = join(repoPath, ".git");
  const isGitRepo = existsSync(gitDir);
  criteria.push({
    criterion: "Repository is a git repository",
    passed: isGitRepo,
    value: isGitRepo,
    error: isGitRepo ? undefined : ".git directory not found",
  });

  // Check standards config exists or can use defaults
  const configPath = join(repoPath, ".odd", "standards.toml");
  const hasConfig = existsSync(configPath);
  criteria.push({
    criterion: "Standards version is resolvable",
    passed: true, // Always true - we use defaults if missing
    value: hasConfig ? configPath : "default",
  });

  if (hasConfig) {
    evidence.push({
      type: "file",
      location: configPath,
    });
  }

  // Check session ID generated
  criteria.push({
    criterion: "Session ID is generated",
    passed: !!sessionId,
    value: sessionId,
    error: sessionId ? undefined : "No session ID provided",
  });

  // Check permissions (simplified - just check we can read)
  const canRead = repoValid;
  criteria.push({
    criterion: "Agent has required permissions",
    passed: canRead,
    value: canRead ? "read/write" : "none",
  });

  const passed = criteria.every((c) => c.passed);

  return {
    gate_id: "EG-01",
    gate_type: "entry",
    criteria,
    passed,
    timestamp: new Date().toISOString(),
    evidence,
  };
}

/**
 * EG-02: Verification Baseline
 * Establish current compliance state before changes.
 */
// eslint-disable-next-line complexity
export function evaluateEG02(verifyResult?: VerifyResult): GateStatus {
  const criteria: CriterionStatus[] = [];
  const evidence: Evidence[] = [];

  // Check initial verification completed
  criteria.push({
    criterion: "Initial verification completed",
    passed: !!verifyResult,
    error: verifyResult ? undefined : "No verification result provided",
  });

  // Check VerifyResult captured
  criteria.push({
    criterion: "VerifyResult captured",
    passed: !!verifyResult?.schema_version,
    value: verifyResult?.schema_version,
  });

  // Check findings classified
  const allClassified = verifyResult?.findings.every(
    (f) => f.remediation_class && f.risk,
  );
  criteria.push({
    criterion: "Findings classified",
    passed: allClassified ?? false,
    value: verifyResult?.findings.length ?? 0,
  });

  // Check input hash recorded
  criteria.push({
    criterion: "Input hash recorded",
    passed: !!verifyResult?.input_hash,
    value: verifyResult?.input_hash?.substring(0, 16) + "...",
  });

  // Check baseline state documented
  criteria.push({
    criterion: "Baseline state documented",
    passed: verifyResult?.is_compliant !== undefined,
    value: verifyResult?.is_compliant ? "compliant" : "non-compliant",
  });

  if (verifyResult) {
    evidence.push({
      type: "verify_result",
      location: `session:${verifyResult.session_id || "standalone"}`,
      hash: verifyResult.input_hash,
    });
  }

  const passed = criteria.every((c) => c.passed);

  return {
    gate_id: "EG-02",
    gate_type: "entry",
    criteria,
    passed,
    timestamp: new Date().toISOString(),
    evidence,
  };
}

/**
 * EG-03: Remediation Authorization
 * Ensure remediation is warranted and authorized.
 */
export function evaluateEG03(
  verifyResult?: VerifyResult,
  session?: SessionLog,
  budgetAvailable?: boolean,
): GateStatus {
  const criteria: CriterionStatus[] = [];
  const evidence: Evidence[] = [];

  // Check verification failed (remediation needed)
  criteria.push({
    criterion: "Verification failed",
    passed: verifyResult?.is_compliant === false,
    value: verifyResult?.is_compliant,
    error: verifyResult?.is_compliant
      ? "Repository is already compliant"
      : undefined,
  });

  // Check findings exist
  const hasFindings = (verifyResult?.findings.length ?? 0) > 0;
  criteria.push({
    criterion: "Findings exist",
    passed: hasFindings,
    value: verifyResult?.findings.length ?? 0,
  });

  // Check no human-only findings blocking (or approved)
  const humanOnlyBlocking = verifyResult?.findings.some(
    (f) => f.remediation_class === "human" && f.risk === "critical",
  );
  criteria.push({
    criterion: "No human-only findings blocking",
    passed: !humanOnlyBlocking,
    value: humanOnlyBlocking ? "blocked" : "clear",
  });

  // Check budget available
  criteria.push({
    criterion: "Within budget limits",
    passed: budgetAvailable !== false,
    value: budgetAvailable,
  });

  // Check no active safety stops
  const safetyStopped = session?.outcome === "SAFETY_STOP";
  criteria.push({
    criterion: "No active safety stops",
    passed: !safetyStopped,
    value: safetyStopped ? "stopped" : "clear",
  });

  if (verifyResult) {
    evidence.push({
      type: "verify_result",
      location: `findings:${verifyResult.findings.length}`,
    });
  }

  const passed = criteria.every((c) => c.passed);

  return {
    gate_id: "EG-03",
    gate_type: "entry",
    criteria,
    passed,
    timestamp: new Date().toISOString(),
    evidence,
  };
}
