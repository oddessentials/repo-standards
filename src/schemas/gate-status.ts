// src/schemas/gate-status.ts
// Quality gate status schemas for tracking gate evaluations

/**
 * Types of quality gates.
 */
export type GateType = "entry" | "phase" | "exit" | "remediation";

/**
 * Status of an individual gate criterion.
 */
export interface CriterionStatus {
  /** Description of the criterion */
  criterion: string;

  /** Whether the criterion passed */
  passed: boolean;

  /** Actual value observed (for debugging) */
  value?: unknown;

  /** Error message if criterion failed */
  error?: string;
}

/**
 * Evidence collected for gate evaluation.
 */
export interface Evidence {
  /** Type of evidence (e.g., "file", "command_output", "api_response") */
  type: string;

  /** Location of the evidence (file path, URL, or reference) */
  location: string;

  /** Content hash for integrity verification */
  hash?: string;
}

/**
 * Status of a quality gate evaluation.
 */
export interface GateStatus {
  /** Gate identifier (e.g., "EG-01", "PG-03", "XG-02") */
  gate_id: string;

  /** Type of gate */
  gate_type: GateType;

  /** Status of each criterion in the gate */
  criteria: CriterionStatus[];

  /** Whether all criteria passed */
  passed: boolean;

  /** When the gate was evaluated (ISO 8601 UTC) */
  timestamp: string;

  /** Evidence collected during evaluation */
  evidence: Evidence[];
}
