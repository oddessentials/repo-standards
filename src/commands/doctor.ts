// src/commands/doctor.ts
// Doctor command - analyze findings and propose remediation strategies

import type {
  VerifyResult,
  Finding,
  RemediationClass,
} from "../schemas/index.js";

/**
 * Options for the doctor command.
 */
export interface DoctorOptions {
  /** Include detailed remediation steps */
  detailed?: boolean;
}

/**
 * Grouped findings by remediation class.
 */
export interface RemediationGroup {
  /** Remediation class for this group */
  class: RemediationClass;

  /** Human-readable label */
  label: string;

  /** Findings in this group */
  findings: Finding[];

  /** Recommended actions for this group */
  actions: string[];
}

/**
 * Result of the doctor command.
 */
export interface DoctorReport {
  /** Input verification result metadata */
  input: {
    input_hash: string;
    verified_at: string;
    is_compliant: boolean;
    total_findings: number;
  };

  /** Findings grouped by remediation class */
  groups: RemediationGroup[];

  /** Overall remediation strategy */
  strategy: {
    /** Recommended order of operations */
    order: RemediationClass[];

    /** Summary of work needed */
    summary: string;

    /** Estimated complexity */
    complexity: "low" | "medium" | "high";
  };

  /** Routing information for conductor */
  routing: {
    /** Findings that can be auto-remediated */
    mechanical: string[];

    /** Findings requiring AI assistance */
    ai: string[];

    /** Findings requiring human approval */
    human: string[];
  };

  /** When the analysis was performed (ISO 8601 UTC) */
  analyzed_at: string;
}

/**
 * Generate remediation actions for mechanical fixes.
 */
function getMechanicalActions(findings: Finding[]): string[] {
  const actions: string[] = [];
  const fileActions = new Map<string, string[]>();

  for (const finding of findings) {
    if (finding.file_path) {
      const existing = fileActions.get(finding.file_path) || [];
      existing.push(finding.remediation_hint);
      fileActions.set(finding.file_path, existing);
    } else {
      actions.push(finding.remediation_hint);
    }
  }

  for (const [file, hints] of fileActions) {
    if (hints.length === 1) {
      actions.push(`${file}: ${hints[0]}`);
    } else {
      actions.push(`${file}: Apply ${hints.length} fixes`);
    }
  }

  return actions;
}

/**
 * Generate remediation actions for AI-assisted fixes.
 */
function getAIActions(findings: Finding[]): string[] {
  return findings.map(
    (f) => `[${f.rule_id}] ${f.title}: ${f.remediation_hint}`,
  );
}

/**
 * Generate remediation actions for human-required fixes.
 */
function getHumanActions(findings: Finding[]): string[] {
  return findings.map(
    (f) =>
      `[${f.rule_id}] ${f.title} (${f.risk} risk): Requires human review - ${f.remediation_hint}`,
  );
}

/**
 * Determine overall complexity.
 */
function determineComplexity(
  mechanical: number,
  ai: number,
  human: number,
): "low" | "medium" | "high" {
  if (human > 0 || ai > 5) return "high";
  if (ai > 0 || mechanical > 10) return "medium";
  return "low";
}

/**
 * Analyze verification findings and propose remediation strategies.
 *
 * @param verifyResult - Result from the verify command
 * @param options - Doctor options
 * @returns Doctor report with remediation analysis
 */
export async function doctor(
  verifyResult: VerifyResult,
  _options: DoctorOptions = {},
): Promise<DoctorReport> {
  const { findings } = verifyResult;

  // Group findings by remediation class
  const mechanical = findings.filter(
    (f) => f.remediation_class === "mechanical",
  );
  const ai = findings.filter((f) => f.remediation_class === "ai");
  const human = findings.filter((f) => f.remediation_class === "human");

  const groups: RemediationGroup[] = [];

  if (mechanical.length > 0) {
    groups.push({
      class: "mechanical",
      label: "Automated Fixes",
      findings: mechanical,
      actions: getMechanicalActions(mechanical),
    });
  }

  if (ai.length > 0) {
    groups.push({
      class: "ai",
      label: "AI-Assisted Remediation",
      findings: ai,
      actions: getAIActions(ai),
    });
  }

  if (human.length > 0) {
    groups.push({
      class: "human",
      label: "Human Review Required",
      findings: human,
      actions: getHumanActions(human),
    });
  }

  // Determine strategy
  const order: RemediationClass[] = [];
  if (mechanical.length > 0) order.push("mechanical");
  if (ai.length > 0) order.push("ai");
  if (human.length > 0) order.push("human");

  const complexity = determineComplexity(
    mechanical.length,
    ai.length,
    human.length,
  );

  let summary: string;
  if (findings.length === 0) {
    summary = "No findings to remediate. Repository is compliant.";
  } else if (human.length > 0) {
    summary = `${findings.length} findings require remediation. Human review needed for ${human.length} item(s).`;
  } else if (ai.length > 0) {
    summary = `${findings.length} findings require remediation. AI assistance recommended for ${ai.length} item(s).`;
  } else {
    summary = `${findings.length} findings can be automatically remediated.`;
  }

  return {
    input: {
      input_hash: verifyResult.input_hash,
      verified_at: verifyResult.verified_at,
      is_compliant: verifyResult.is_compliant,
      total_findings: findings.length,
    },
    groups,
    strategy: {
      order,
      summary,
      complexity,
    },
    routing: {
      mechanical: mechanical.map((f) => f.finding_id),
      ai: ai.map((f) => f.finding_id),
      human: human.map((f) => f.finding_id),
    },
    analyzed_at: new Date().toISOString(),
  };
}
