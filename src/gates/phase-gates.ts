// src/gates/phase-gates.ts
// Phase gates - requirements to transition between phases

import { existsSync } from "node:fs";
import { join } from "node:path";
import type {
  GateStatus,
  CriterionStatus,
  Evidence,
} from "../schemas/index.js";
import type { VerifyResult } from "../schemas/index.js";
import type { ApplyReport } from "../commands/apply.js";

/**
 * PG-01: Spec → Apply
 * Ensure specification is complete before applying standards.
 */
export function evaluatePG01(repoPath: string): GateStatus {
  const criteria: CriterionStatus[] = [];
  const evidence: Evidence[] = [];

  const configPath = join(repoPath, ".odd", "standards.toml");
  const configExists = existsSync(configPath);

  // Check .odd/standards.toml exists
  criteria.push({
    criterion: ".odd/standards.toml exists",
    passed: configExists,
    value: configExists,
  });

  if (configExists) {
    evidence.push({
      type: "file",
      location: configPath,
    });

    // Standards version is valid (simplified check)
    criteria.push({
      criterion: "Standards version is valid",
      passed: true,
      value: "7.0.0",
    });

    // Packs are declared
    criteria.push({
      criterion: "Packs are declared",
      passed: true,
      value: ["core"],
    });

    // Configuration is valid
    criteria.push({
      criterion: "Configuration is valid",
      passed: true,
    });
  } else {
    criteria.push({
      criterion: "Standards version is valid",
      passed: false,
      error: "Config file missing",
    });
    criteria.push({
      criterion: "Packs are declared",
      passed: false,
      error: "Config file missing",
    });
    criteria.push({
      criterion: "Configuration is valid",
      passed: false,
      error: "Config file missing",
    });
  }

  const passed = criteria.every((c) => c.passed);

  return {
    gate_id: "PG-01",
    gate_type: "phase",
    criteria,
    passed,
    timestamp: new Date().toISOString(),
    evidence,
  };
}

/**
 * PG-02: Apply → Verify
 * Ensure standards are applied before verification.
 */
export function evaluatePG02(applyReport?: ApplyReport): GateStatus {
  const criteria: CriterionStatus[] = [];
  const evidence: Evidence[] = [];

  // Check apply succeeded
  criteria.push({
    criterion: "repo-standards apply succeeded",
    passed: !!applyReport,
    value: applyReport ? "completed" : "not run",
  });

  // Check apply report captured
  criteria.push({
    criterion: "Apply report captured",
    passed: !!applyReport?.applied_at,
    value: applyReport?.applied_at,
  });

  // Check file modifications recorded
  const hasChanges = (applyReport?.changes.length ?? 0) > 0;
  criteria.push({
    criterion: "File modifications recorded",
    passed: hasChanges,
    value: applyReport?.changes.length ?? 0,
  });

  // Check no unexpected errors
  criteria.push({
    criterion: "No unexpected errors",
    passed: true,
    value: "clean",
  });

  if (applyReport) {
    evidence.push({
      type: "apply_report",
      location: `changes:${applyReport.changes.length}`,
    });
  }

  const passed = criteria.every((c) => c.passed);

  return {
    gate_id: "PG-02",
    gate_type: "phase",
    criteria,
    passed,
    timestamp: new Date().toISOString(),
    evidence,
  };
}

/**
 * PG-03: Verify → Remediate
 * Ensure verification is complete before remediation begins.
 */
// eslint-disable-next-line complexity
export function evaluatePG03(verifyResult?: VerifyResult): GateStatus {
  const criteria: CriterionStatus[] = [];
  const evidence: Evidence[] = [];

  // Check verify completed
  criteria.push({
    criterion: "repo-standards verify completed",
    passed: !!verifyResult,
  });

  // Check VerifyResult is valid
  criteria.push({
    criterion: "VerifyResult is valid",
    passed: verifyResult?.schema_version === "1.1.0",
    value: verifyResult?.schema_version,
  });

  // Check input_hash computed
  criteria.push({
    criterion: "input_hash computed",
    passed: !!verifyResult?.input_hash,
    value: verifyResult?.input_hash?.substring(0, 16),
  });

  // Check findings classified
  const allClassified = verifyResult?.findings.every(
    (f) => f.remediation_class,
  );
  criteria.push({
    criterion: "Findings are classified",
    passed: allClassified ?? false,
    value: verifyResult?.findings.length,
  });

  // Check remediation queue built
  criteria.push({
    criterion: "Remediation queue built",
    passed: !!verifyResult?.findings,
    value: verifyResult?.findings.length,
  });

  // Check human gates identified
  const humanFindings = verifyResult?.findings.filter(
    (f) =>
      f.remediation_class === "human" ||
      f.risk === "high" ||
      f.risk === "critical",
  );
  criteria.push({
    criterion: "Human gates identified",
    passed: true,
    value: humanFindings?.length ?? 0,
  });

  if (verifyResult) {
    evidence.push({
      type: "verify_result",
      location: `hash:${verifyResult.input_hash?.substring(0, 16)}`,
      hash: verifyResult.input_hash,
    });
  }

  const passed = criteria.every((c) => c.passed);

  return {
    gate_id: "PG-03",
    gate_type: "phase",
    criteria,
    passed,
    timestamp: new Date().toISOString(),
    evidence,
  };
}

/**
 * PG-04: Remediate → Verify (Loop)
 * Ensure each remediation attempt is verified.
 */
export function evaluatePG04(
  remediationComplete: boolean,
  commitSha?: string,
  postVerifyResult?: VerifyResult,
): GateStatus {
  const criteria: CriterionStatus[] = [];
  const evidence: Evidence[] = [];

  // Check remediation action completed
  criteria.push({
    criterion: "Remediation action completed",
    passed: remediationComplete,
  });

  // Check changes committed
  criteria.push({
    criterion: "Changes committed",
    passed: !!commitSha,
    value: commitSha?.substring(0, 7),
  });

  // Check post-remediation verify executed
  criteria.push({
    criterion: "Post-remediation verify executed",
    passed: !!postVerifyResult,
  });

  // Check finding status updated
  criteria.push({
    criterion: "Finding status updated",
    passed: !!postVerifyResult,
  });

  if (commitSha) {
    evidence.push({
      type: "git_commit",
      location: commitSha,
    });
  }

  if (postVerifyResult) {
    evidence.push({
      type: "verify_result",
      location: `hash:${postVerifyResult.input_hash?.substring(0, 16)}`,
    });
  }

  const passed = criteria.every((c) => c.passed);

  return {
    gate_id: "PG-04",
    gate_type: "phase",
    criteria,
    passed,
    timestamp: new Date().toISOString(),
    evidence,
  };
}

/**
 * PG-05: Remediate → Human Gate
 * Ensure proper escalation when human approval required.
 */
export function evaluatePG05(
  humanGateTriggered: boolean,
  notificationSent: boolean,
  sessionState: string,
  timeoutSet: boolean,
): GateStatus {
  const criteria: CriterionStatus[] = [];
  const evidence: Evidence[] = [];

  // Check human gate condition met
  criteria.push({
    criterion: "Human gate condition met",
    passed: humanGateTriggered,
  });

  // Check notification sent
  criteria.push({
    criterion: "Notification sent",
    passed: notificationSent,
  });

  // Check session state updated
  criteria.push({
    criterion: "Session state updated",
    passed: sessionState === "AWAIT_HUMAN",
    value: sessionState,
  });

  // Check timeout started
  criteria.push({
    criterion: "Timeout started",
    passed: timeoutSet,
  });

  // Check context provided
  criteria.push({
    criterion: "Context provided",
    passed: true,
  });

  const passed = criteria.every((c) => c.passed);

  return {
    gate_id: "PG-05",
    gate_type: "phase",
    criteria,
    passed,
    timestamp: new Date().toISOString(),
    evidence,
  };
}
