// src/schemas/verify-result.ts
// VerifyResult schema v1.1.0 - structured output from verify command

import type { Finding, Severity, RemediationClass } from "./finding.js";

/**
 * Summary of findings by category.
 */
export interface VerifySummary {
  /** Total number of findings */
  total: number;

  /** Count of findings by severity level */
  by_severity: Record<Severity, number>;

  /** Count of findings by remediation class */
  by_remediation_class: Record<RemediationClass, number>;
}

/**
 * Result of running the verify command against a repository.
 * This is the primary output schema for compliance verification.
 *
 * Schema version: 1.1.0
 */
export interface VerifyResult {
  /** Schema version for this result format */
  schema_version: "1.1.0";

  /** Optional session ID linking to a compliance session */
  session_id?: string;

  // Determinism

  /** SHA-256 hash of normalized inputs for reproducibility verification */
  input_hash: string;

  /** When verification was performed (ISO 8601 UTC) */
  verified_at: string;

  // Compliance state

  /** Whether the repository is compliant with declared standards */
  is_compliant: boolean;

  /** Version of standards used for verification */
  standards_version: string;

  /** Stack identifier used for verification */
  stack_id: string;

  // Findings

  /** List of compliance violations found */
  findings: Finding[];

  /** Summary statistics for findings */
  summary: VerifySummary;

  // Metadata

  /** Absolute path to the verified repository */
  repository_path: string;

  /** Time taken to complete verification in milliseconds */
  execution_time_ms: number;
}
