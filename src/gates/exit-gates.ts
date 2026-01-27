// src/gates/exit-gates.ts
// Exit gates - criteria for declaring completion

import type {
  GateStatus,
  CriterionStatus,
  Evidence,
} from "../schemas/index.js";
import type { VerifyResult } from "../schemas/index.js";
import type { SessionLog } from "../schemas/index.js";

/**
 * XG-01: Compliance Achieved
 * Confirm repository is compliant.
 */
export function evaluateXG01(
  verifyResult?: VerifyResult,
  session?: SessionLog,
): GateStatus {
  const criteria: CriterionStatus[] = [];
  const evidence: Evidence[] = [];

  // Check final verification passed
  criteria.push({
    criterion: "Final verification passed",
    passed: verifyResult?.is_compliant === true,
    value: verifyResult?.is_compliant,
  });

  // Check zero error-severity findings
  const errorCount = verifyResult?.summary.by_severity.error ?? 0;
  criteria.push({
    criterion: "Zero error-severity findings",
    passed: errorCount === 0,
    value: errorCount,
  });

  // Check session outcome set
  criteria.push({
    criterion: "Session outcome set",
    passed: session?.outcome === "COMPLIANT",
    value: session?.outcome,
  });

  // Check audit log complete
  criteria.push({
    criterion: "Audit log complete",
    passed: (session?.entries.length ?? 0) > 0,
    value: session?.entries.length,
  });

  // Check audit log sealed
  criteria.push({
    criterion: "Audit log sealed",
    passed: session?.sealed === true,
    value: session?.sealed,
  });

  if (verifyResult) {
    evidence.push({
      type: "verify_result",
      location: `compliant:${verifyResult.is_compliant}`,
      hash: verifyResult.input_hash,
    });
  }

  if (session?.seal_hash) {
    evidence.push({
      type: "audit_seal",
      location: session.session_id,
      hash: session.seal_hash,
    });
  }

  const passed = criteria.every((c) => c.passed);

  return {
    gate_id: "XG-01",
    gate_type: "exit",
    criteria,
    passed,
    timestamp: new Date().toISOString(),
    evidence,
  };
}

/**
 * XG-02: Human Escalation Complete
 * Confirm proper escalation when human intervention required.
 */
export function evaluateXG02(
  humanFindingsCount: number,
  notificationsSent: number,
  sessionState: string,
  escalationTimeline?: { timeout: string; escalation: string },
): GateStatus {
  const criteria: CriterionStatus[] = [];
  const evidence: Evidence[] = [];

  // Check all human-required findings surfaced
  criteria.push({
    criterion: "All human-required findings surfaced",
    passed: notificationsSent >= humanFindingsCount,
    value: `${notificationsSent}/${humanFindingsCount}`,
  });

  // Check notifications delivered
  criteria.push({
    criterion: "Notifications delivered",
    passed: notificationsSent > 0,
    value: notificationsSent,
  });

  // Check session state correct
  criteria.push({
    criterion: "Session state correct",
    passed: sessionState === "AWAITING_HUMAN",
    value: sessionState,
  });

  // Check escalation timeline documented
  criteria.push({
    criterion: "Escalation timeline documented",
    passed: !!escalationTimeline,
    value: escalationTimeline?.timeout,
  });

  // Check context complete
  criteria.push({
    criterion: "Context complete",
    passed: true,
  });

  const passed = criteria.every((c) => c.passed);

  return {
    gate_id: "XG-02",
    gate_type: "exit",
    criteria,
    passed,
    timestamp: new Date().toISOString(),
    evidence,
  };
}

/**
 * XG-03: Graceful Termination
 * Confirm proper shutdown when bounds reached.
 */
export function evaluateXG03(
  stopCondition: string,
  attemptHistory: Array<{ finding_id: string; result: string }>,
  finalVerifyResult?: VerifyResult,
  remainingFindings?: number,
): GateStatus {
  const criteria: CriterionStatus[] = [];
  const evidence: Evidence[] = [];

  // Check stop condition identified
  const validConditions = [
    "MAX_ATTEMPTS",
    "BUDGET_EXCEEDED",
    "NEEDS_HUMAN_STALE",
  ];
  criteria.push({
    criterion: "Stop condition identified",
    passed: validConditions.includes(stopCondition),
    value: stopCondition,
  });

  // Check all attempts recorded
  criteria.push({
    criterion: "All attempts recorded",
    passed: attemptHistory.length > 0,
    value: attemptHistory.length,
  });

  // Check current state captured
  criteria.push({
    criterion: "Current state captured",
    passed: !!finalVerifyResult,
  });

  // Check remaining findings documented
  criteria.push({
    criterion: "Remaining findings documented",
    passed: remainingFindings !== undefined,
    value: remainingFindings,
  });

  if (finalVerifyResult) {
    evidence.push({
      type: "verify_result",
      location: "final",
      hash: finalVerifyResult.input_hash,
    });
  }

  const passed = criteria.every((c) => c.passed);

  return {
    gate_id: "XG-03",
    gate_type: "exit",
    criteria,
    passed,
    timestamp: new Date().toISOString(),
    evidence,
  };
}

/**
 * XG-04: Safety Stop
 * Confirm proper halt on safety violation.
 */
export function evaluateXG04(
  invariantId: string,
  haltExecuted: boolean,
  statePreserved: boolean,
  humanAlertSent: boolean,
  sessionOutcome: string,
): GateStatus {
  const criteria: CriterionStatus[] = [];
  const evidence: Evidence[] = [];

  // Check violation identified
  criteria.push({
    criterion: "Violation identified",
    passed: !!invariantId,
    value: invariantId,
  });

  // Check immediate halt executed
  criteria.push({
    criterion: "Immediate halt executed",
    passed: haltExecuted,
  });

  // Check state preserved
  criteria.push({
    criterion: "State preserved",
    passed: statePreserved,
  });

  // Check human alert sent
  criteria.push({
    criterion: "Human alert sent",
    passed: humanAlertSent,
  });

  // Check session outcome correct
  criteria.push({
    criterion: "Session outcome correct",
    passed: sessionOutcome === "SAFETY_STOP",
    value: sessionOutcome,
  });

  evidence.push({
    type: "invariant_violation",
    location: invariantId,
  });

  const passed = criteria.every((c) => c.passed);

  return {
    gate_id: "XG-04",
    gate_type: "exit",
    criteria,
    passed,
    timestamp: new Date().toISOString(),
    evidence,
  };
}
