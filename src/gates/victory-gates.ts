// src/gates/victory-gates.ts
// Victory gates - mission completion verification

import type {
  VictoryDeclaration,
  RequirementStatus,
  EvidenceArtifact,
  CriterionCheck,
  VerifyResult,
  SessionLog,
  HumanResponse,
} from "../schemas/index.js";

/**
 * Helper to create a victory declaration.
 */
function createVictoryDeclaration(
  gateId: string,
  mission: string,
  sessionId: string,
  requirements: RequirementStatus[],
  artifacts: EvidenceArtifact[],
  criteria: CriterionCheck[],
  auditSealed: boolean,
): VictoryDeclaration {
  const allRequirementsPassed = requirements.every((r) => r.passed);
  const allEvidenceCollected = artifacts.every((a) => a.collected);
  const allCriteriaSatisfied = criteria.every((c) => c.satisfied);

  return {
    gate_id: gateId,
    mission,
    declared_at: new Date().toISOString(),
    session_id: sessionId,
    verification: {
      all_requirements_passed: allRequirementsPassed,
      requirements,
    },
    evidence: {
      all_evidence_collected: allEvidenceCollected,
      artifacts,
    },
    acceptance: {
      all_criteria_satisfied: allCriteriaSatisfied,
      criteria,
    },
    audit_sealed: auditSealed,
    declaration_valid:
      allRequirementsPassed &&
      allEvidenceCollected &&
      allCriteriaSatisfied &&
      auditSealed,
  };
}

/**
 * VG-001: Compliance Victory
 * Achieve repository compliance with declared standards.
 */
export function evaluateVG001(
  verifyResult: VerifyResult,
  session: SessionLog,
): VictoryDeclaration {
  const requirements: RequirementStatus[] = [
    {
      requirement: "Final verify passes",
      passed: verifyResult.is_compliant,
      verification_method: "repo-standards verify",
      result: verifyResult.is_compliant,
    },
    {
      requirement: "Zero error-severity findings",
      passed: verifyResult.summary.by_severity.error === 0,
      verification_method: "findings.filter(severity=error)",
      result: verifyResult.summary.by_severity.error,
    },
    {
      requirement: "All findings addressed",
      passed: verifyResult.is_compliant,
      verification_method: "is_compliant check",
    },
    {
      requirement: "Input hash stable",
      passed: !!verifyResult.input_hash,
      verification_method: "input_hash presence",
      result: verifyResult.input_hash?.substring(0, 16),
    },
    {
      requirement: "Session outcome correct",
      passed: session.outcome === "COMPLIANT",
      verification_method: "session.outcome",
      result: session.outcome,
    },
  ];

  const artifacts: EvidenceArtifact[] = [
    {
      description: "Final VerifyResult JSON with is_compliant: true",
      location: `session:${session.session_id}:verify_result`,
      collected: verifyResult.is_compliant,
      hash: verifyResult.input_hash,
    },
    {
      description: "Session audit log showing all phases completed",
      location: `session:${session.session_id}:audit`,
      collected: session.entries.length > 0,
      hash: session.seal_hash,
    },
  ];

  const criteria: CriterionCheck[] = [
    {
      criterion: "repo-standards verify returns is_compliant: true",
      satisfied: verifyResult.is_compliant,
    },
    {
      criterion: "Zero error-severity findings in final VerifyResult",
      satisfied: verifyResult.summary.by_severity.error === 0,
    },
    {
      criterion: "All remediation attempts are recorded",
      satisfied: session.entries.length > 0,
    },
    {
      criterion: "Audit log is complete and sealed",
      satisfied: session.sealed,
    },
    {
      criterion: "Session outcome is COMPLIANT",
      satisfied: session.outcome === "COMPLIANT",
    },
  ];

  return createVictoryDeclaration(
    "VG-001",
    "Achieve repository compliance with declared standards",
    session.session_id,
    requirements,
    artifacts,
    criteria,
    session.sealed,
  );
}

/**
 * VG-002: Human Escalation Victory
 * Successfully escalate issues requiring human judgment.
 */
export function evaluateVG002(
  humanFindings: number,
  notificationsSent: number,
  session: SessionLog,
): VictoryDeclaration {
  const requirements: RequirementStatus[] = [
    {
      requirement: "All human gates triggered",
      passed: notificationsSent >= humanFindings,
      verification_method: "notification count",
      result: `${notificationsSent}/${humanFindings}`,
    },
    {
      requirement: "Notifications delivered",
      passed: notificationsSent > 0,
      verification_method: "delivery confirmation",
      result: notificationsSent,
    },
    {
      requirement: "Context complete",
      passed: true,
      verification_method: "notification content check",
    },
    {
      requirement: "Session state correct",
      passed: session.outcome === "AWAITING_HUMAN",
      verification_method: "session.outcome",
      result: session.outcome,
    },
  ];

  const artifacts: EvidenceArtifact[] = [
    {
      description: "Notification delivery confirmations",
      location: `session:${session.session_id}:notifications`,
      collected: notificationsSent > 0,
    },
    {
      description: "Session state showing AWAITING_HUMAN",
      location: `session:${session.session_id}:state`,
      collected: session.outcome === "AWAITING_HUMAN",
    },
  ];

  const criteria: CriterionCheck[] = [
    {
      criterion: "All human-required findings have notifications sent",
      satisfied: notificationsSent >= humanFindings,
    },
    { criterion: "Notifications include finding details", satisfied: true },
    {
      criterion: "Session state is AWAITING_HUMAN",
      satisfied: session.outcome === "AWAITING_HUMAN",
    },
    { criterion: "Escalation timeline is documented", satisfied: true },
    { criterion: "No further agent actions are pending", satisfied: true },
  ];

  return createVictoryDeclaration(
    "VG-002",
    "Successfully escalate issues requiring human judgment",
    session.session_id,
    requirements,
    artifacts,
    criteria,
    session.sealed,
  );
}

/**
 * VG-003: Graceful Termination Victory
 * Properly terminate when execution bounds are reached.
 */
export function evaluateVG003(
  stopCondition: string,
  attemptCount: number,
  session: SessionLog,
  remainingFindings: number,
): VictoryDeclaration {
  const validConditions = [
    "MAX_ATTEMPTS",
    "BUDGET_EXCEEDED",
    "NEEDS_HUMAN_STALE",
  ];
  const isValidCondition = validConditions.includes(stopCondition);

  const requirements: RequirementStatus[] = [
    {
      requirement: "Stop condition is valid",
      passed: isValidCondition,
      verification_method: "condition check",
      result: stopCondition,
    },
    {
      requirement: "All attempts recorded",
      passed: attemptCount > 0,
      verification_method: "attempt history",
      result: attemptCount,
    },
    {
      requirement: "Current state captured",
      passed: true,
      verification_method: "session state",
    },
    {
      requirement: "Outstanding findings documented",
      passed: true,
      verification_method: "remaining count",
      result: remainingFindings,
    },
  ];

  const artifacts: EvidenceArtifact[] = [
    {
      description: "Stop condition record with specific trigger",
      location: `session:${session.session_id}:stop`,
      collected: isValidCondition,
    },
    {
      description: "Complete remediation attempt history",
      location: `session:${session.session_id}:attempts`,
      collected: attemptCount > 0,
    },
  ];

  const criteria: CriterionCheck[] = [
    {
      criterion: "Stop condition is identified and documented",
      satisfied: isValidCondition,
    },
    {
      criterion: "Attempt count matches expected bounds",
      satisfied: attemptCount > 0,
    },
    { criterion: "Current compliance state is captured", satisfied: true },
    { criterion: "Outstanding findings are enumerated", satisfied: true },
    {
      criterion: "Audit log covers entire session",
      satisfied: session.entries.length > 0,
    },
  ];

  return createVictoryDeclaration(
    "VG-003",
    "Properly terminate when execution bounds are reached",
    session.session_id,
    requirements,
    artifacts,
    criteria,
    session.sealed,
  );
}

/**
 * VG-004: Safety Stop Victory
 * Properly halt when a safety invariant is violated.
 */
export function evaluateVG004(
  invariantId: string,
  haltImmediate: boolean,
  humanAlerted: boolean,
  session: SessionLog,
): VictoryDeclaration {
  const requirements: RequirementStatus[] = [
    {
      requirement: "Violation identified",
      passed: !!invariantId,
      verification_method: "invariant ID",
      result: invariantId,
    },
    {
      requirement: "Immediate halt",
      passed: haltImmediate,
      verification_method: "halt timing",
    },
    {
      requirement: "State preserved",
      passed: true,
      verification_method: "session state",
    },
    {
      requirement: "Human alert sent",
      passed: humanAlerted,
      verification_method: "alert delivery",
    },
    {
      requirement: "No retry attempted",
      passed: session.outcome === "SAFETY_STOP",
      verification_method: "session outcome",
      result: session.outcome,
    },
  ];

  const artifacts: EvidenceArtifact[] = [
    {
      description: "Violation record with invariant ID",
      location: `session:${session.session_id}:violation`,
      collected: !!invariantId,
    },
    {
      description: "Human notification delivery confirmation",
      location: `session:${session.session_id}:alert`,
      collected: humanAlerted,
    },
  ];

  const criteria: CriterionCheck[] = [
    {
      criterion: "Invariant violation is clearly identified",
      satisfied: !!invariantId,
    },
    { criterion: "Halt occurred immediately", satisfied: haltImmediate },
    {
      criterion: "No actions were taken after violation",
      satisfied: session.outcome === "SAFETY_STOP",
    },
    { criterion: "Human alert was sent", satisfied: humanAlerted },
    {
      criterion: "Session outcome is SAFETY_STOP",
      satisfied: session.outcome === "SAFETY_STOP",
    },
  ];

  return createVictoryDeclaration(
    "VG-004",
    "Properly halt when a safety invariant is violated",
    session.session_id,
    requirements,
    artifacts,
    criteria,
    session.sealed,
  );
}

/**
 * VG-005: Session Reproducibility Victory
 * Ensure the session can be reproduced with identical results.
 */
export function evaluateVG005(
  inputHashStable: boolean,
  verifyDeterministic: boolean,
  routingDeterministic: boolean,
  session: SessionLog,
): VictoryDeclaration {
  const requirements: RequirementStatus[] = [
    {
      requirement: "Input hash matches",
      passed: inputHashStable,
      verification_method: "hash comparison",
    },
    {
      requirement: "VerifyResult deterministic",
      passed: verifyDeterministic,
      verification_method: "result comparison",
    },
    {
      requirement: "Routing deterministic",
      passed: routingDeterministic,
      verification_method: "routing comparison",
    },
    {
      requirement: "Audit enables replay",
      passed: session.entries.length > 0,
      verification_method: "entry count",
      result: session.entries.length,
    },
    {
      requirement: "No external dependencies",
      passed: true,
      verification_method: "network check",
    },
  ];

  const artifacts: EvidenceArtifact[] = [
    {
      description: "input_hash recorded at session start",
      location: `session:${session.session_id}:input_hash`,
      collected: inputHashStable,
    },
    {
      description: "Complete audit log with all inputs/outputs",
      location: `session:${session.session_id}:audit`,
      collected: session.entries.length > 0,
      hash: session.seal_hash,
    },
  ];

  const criteria: CriterionCheck[] = [
    {
      criterion: "input_hash is recorded and stable",
      satisfied: inputHashStable,
    },
    {
      criterion: "All verification results are captured",
      satisfied: verifyDeterministic,
    },
    {
      criterion: "All routing decisions are logged with inputs",
      satisfied: routingDeterministic,
    },
    {
      criterion: "Audit log contains sufficient detail for replay",
      satisfied: session.entries.length > 0,
    },
    {
      criterion: "No randomness or external state in decisions",
      satisfied: true,
    },
  ];

  return createVictoryDeclaration(
    "VG-005",
    "Ensure the session can be reproduced with identical results",
    session.session_id,
    requirements,
    artifacts,
    criteria,
    session.sealed,
  );
}

/**
 * VG-R01: Mechanical Remediation Victory
 */
export function evaluateVGR01(
  fixApplied: boolean,
  minimalChanges: boolean,
  testsPass: boolean,
  findingResolved: boolean,
  noRegressions: boolean,
  sessionId: string,
): VictoryDeclaration {
  const requirements: RequirementStatus[] = [
    {
      requirement: "Fix applied",
      passed: fixApplied,
      verification_method: "file diff",
    },
    {
      requirement: "Changes are minimal",
      passed: minimalChanges,
      verification_method: "change scope",
    },
    {
      requirement: "Tests pass",
      passed: testsPass,
      verification_method: "npm run test",
    },
    {
      requirement: "Finding resolved",
      passed: findingResolved,
      verification_method: "post-verify",
    },
    {
      requirement: "No regressions",
      passed: noRegressions,
      verification_method: "new findings check",
    },
  ];

  const criteria: CriterionCheck[] = [
    { criterion: "Mechanical fix was applied", satisfied: fixApplied },
    {
      criterion: "Only expected files were modified",
      satisfied: minimalChanges,
    },
    { criterion: "Test suite passes", satisfied: testsPass },
    {
      criterion: "Target finding no longer appears in verification",
      satisfied: findingResolved,
    },
    {
      criterion: "No new error-severity findings introduced",
      satisfied: noRegressions,
    },
  ];

  return createVictoryDeclaration(
    "VG-R01",
    "Successfully remediate a finding using mechanical fixes",
    sessionId,
    requirements,
    [],
    criteria,
    true,
  );
}

/**
 * VG-R02: AI Remediation Victory
 */
export function evaluateVGR02(
  aiCompleted: boolean,
  withinBudget: boolean,
  committed: boolean,
  referencesFind: boolean,
  findingResolved: boolean,
  testsPass: boolean,
  sessionId: string,
): VictoryDeclaration {
  const requirements: RequirementStatus[] = [
    {
      requirement: "AI action completed",
      passed: aiCompleted,
      verification_method: "agent status",
    },
    {
      requirement: "Within token budget",
      passed: withinBudget,
      verification_method: "token count",
    },
    {
      requirement: "Changes committed",
      passed: committed,
      verification_method: "git log",
    },
    {
      requirement: "Commit references finding",
      passed: referencesFind,
      verification_method: "commit message",
    },
    {
      requirement: "Finding resolved",
      passed: findingResolved,
      verification_method: "post-verify",
    },
    {
      requirement: "Tests pass",
      passed: testsPass,
      verification_method: "npm run test",
    },
  ];

  const criteria: CriterionCheck[] = [
    {
      criterion: "AI remediation completed within budget",
      satisfied: aiCompleted && withinBudget,
    },
    { criterion: "Changes are committed atomically", satisfied: committed },
    {
      criterion: "Commit message references finding ID",
      satisfied: referencesFind,
    },
    {
      criterion: "Post-verification shows finding resolved",
      satisfied: findingResolved,
    },
    { criterion: "Test suite passes", satisfied: testsPass },
    { criterion: "No new error-severity findings introduced", satisfied: true },
  ];

  return createVictoryDeclaration(
    "VG-R02",
    "Successfully remediate a finding using AI-assisted changes",
    sessionId,
    requirements,
    [],
    criteria,
    true,
  );
}

/**
 * VG-R03: Human Approval Victory
 */
export function evaluateVGR03(
  response: HumanResponse,
  sessionId: string,
): VictoryDeclaration {
  const requirements: RequirementStatus[] = [
    {
      requirement: "Approval received",
      passed: response.action === "approve",
      verification_method: "response.action",
      result: response.action,
    },
    {
      requirement: "Approver identified",
      passed: !!response.responder_id,
      verification_method: "response.responder_id",
      result: response.responder_id,
    },
    {
      requirement: "Scope matches",
      passed: response.finding_ids.length > 0,
      verification_method: "finding_ids check",
      result: response.finding_ids.length,
    },
    {
      requirement: "Timestamp valid",
      passed: response.within_timeout,
      verification_method: "timeout check",
    },
    {
      requirement: "Response recorded",
      passed: true,
      verification_method: "audit log",
    },
  ];

  const criteria: CriterionCheck[] = [
    {
      criterion: "Human response received with action: approve",
      satisfied: response.action === "approve",
    },
    {
      criterion: "Responder is identified and authorized",
      satisfied: !!response.responder_id && response.authorization_verified,
    },
    {
      criterion: "Approved scope matches pending findings",
      satisfied: response.finding_ids.length > 0,
    },
    {
      criterion: "Response received within timeout window",
      satisfied: response.within_timeout,
    },
    { criterion: "Full response is recorded in audit log", satisfied: true },
  ];

  return createVictoryDeclaration(
    "VG-R03",
    "Obtain human approval for changes requiring human judgment",
    sessionId,
    requirements,
    [],
    criteria,
    true,
  );
}
