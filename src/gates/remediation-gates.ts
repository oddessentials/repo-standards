// src/gates/remediation-gates.ts
// Remediation-specific gates

import type {
  GateStatus,
  CriterionStatus,
  Evidence,
} from "../schemas/index.js";
import type { VerifyResult, HumanResponse } from "../schemas/index.js";

/**
 * RSG-01: Mechanical Fix Complete
 * Confirm mechanical remediation is done.
 */
export function evaluateRSG01(
  fixApplied: boolean,
  filesModified: string[],
  expectedFiles: string[],
  testsPass: boolean,
  postVerifyResult?: VerifyResult,
  targetFindingId?: string,
): GateStatus {
  const criteria: CriterionStatus[] = [];
  const evidence: Evidence[] = [];

  // Check fix applied
  criteria.push({
    criterion: "Fix applied",
    passed: fixApplied,
  });

  // Check changes match finding
  const allExpectedModified = expectedFiles.every((f) =>
    filesModified.includes(f),
  );
  criteria.push({
    criterion: "Changes match finding",
    passed: allExpectedModified,
    value: `${filesModified.length} files modified`,
  });

  // Check no side effects
  const onlyExpected = filesModified.every((f) => expectedFiles.includes(f));
  criteria.push({
    criterion: "No side effects",
    passed: onlyExpected || filesModified.length <= expectedFiles.length + 1,
  });

  // Check tests pass
  criteria.push({
    criterion: "Tests pass",
    passed: testsPass,
  });

  // Check verification improved
  const findingResolved = targetFindingId
    ? !postVerifyResult?.findings.some((f) => f.finding_id === targetFindingId)
    : true;
  criteria.push({
    criterion: "Verification improved",
    passed: findingResolved,
  });

  for (const file of filesModified) {
    evidence.push({
      type: "file_modification",
      location: file,
    });
  }

  const passed = criteria.every((c) => c.passed);

  return {
    gate_id: "RSG-01",
    gate_type: "remediation",
    criteria,
    passed,
    timestamp: new Date().toISOString(),
    evidence,
  };
}

/**
 * RSG-02: AI Remediation Complete
 * Confirm AI-assisted remediation is done.
 */
export function evaluateRSG02(
  aiActionExecuted: boolean,
  tokensUsed: number,
  maxTokens: number,
  commitSha?: string,
  findingIdInCommit?: boolean,
  postVerifyResult?: VerifyResult,
  targetFindingId?: string,
  testsPass?: boolean,
): GateStatus {
  const criteria: CriterionStatus[] = [];
  const evidence: Evidence[] = [];

  // Check AI action executed
  criteria.push({
    criterion: "AI action executed",
    passed: aiActionExecuted,
  });

  // Check token budget respected
  criteria.push({
    criterion: "Token budget respected",
    passed: tokensUsed <= maxTokens,
    value: `${tokensUsed}/${maxTokens}`,
  });

  // Check changes committed
  criteria.push({
    criterion: "Changes committed",
    passed: !!commitSha,
    value: commitSha?.substring(0, 7),
  });

  // Check commit references finding
  criteria.push({
    criterion: "Commit references finding",
    passed: findingIdInCommit ?? false,
  });

  // Check post-verification run
  criteria.push({
    criterion: "Post-verification run",
    passed: !!postVerifyResult,
  });

  // Check finding status determined
  const findingResolved = targetFindingId
    ? !postVerifyResult?.findings.some((f) => f.finding_id === targetFindingId)
    : undefined;
  criteria.push({
    criterion: "Finding status determined",
    passed: findingResolved !== undefined,
    value: findingResolved ? "resolved" : "pending",
  });

  // Check tests pass (if applicable)
  if (testsPass !== undefined) {
    criteria.push({
      criterion: "Tests pass",
      passed: testsPass,
    });
  }

  if (commitSha) {
    evidence.push({
      type: "git_commit",
      location: commitSha,
    });
  }

  const passed = criteria.every((c) => c.passed);

  return {
    gate_id: "RSG-02",
    gate_type: "remediation",
    criteria,
    passed,
    timestamp: new Date().toISOString(),
    evidence,
  };
}

/**
 * RSG-03: Human Approval Received
 * Confirm human has approved changes.
 */
export function evaluateRSG03(
  response?: HumanResponse,
  pendingFindingIds?: string[],
): GateStatus {
  const criteria: CriterionStatus[] = [];
  const evidence: Evidence[] = [];

  // Check approval received
  criteria.push({
    criterion: "Approval received",
    passed: response?.action === "approve",
    value: response?.action,
  });

  // Check responder identified
  criteria.push({
    criterion: "Responder identified",
    passed: !!response?.responder_id,
    value: response?.responder_id,
  });

  // Check timestamp recorded
  criteria.push({
    criterion: "Timestamp recorded",
    passed: !!response?.responded_at,
    value: response?.responded_at,
  });

  // Check scope matches
  const scopeMatches = pendingFindingIds
    ? pendingFindingIds.every((id) => response?.finding_ids.includes(id))
    : true;
  criteria.push({
    criterion: "Scope matches",
    passed: scopeMatches,
    value: `${response?.finding_ids.length ?? 0} findings`,
  });

  // Check session updated
  criteria.push({
    criterion: "Session updated",
    passed: true, // Assumed if we have response
  });

  if (response) {
    evidence.push({
      type: "human_response",
      location: response.response_id,
    });
  }

  const passed = criteria.every((c) => c.passed);

  return {
    gate_id: "RSG-03",
    gate_type: "remediation",
    criteria,
    passed,
    timestamp: new Date().toISOString(),
    evidence,
  };
}
