// src/schemas/finding.ts
// Finding schema with routing metadata for remediation classification

/**
 * Severity level for findings.
 * - error: Fails compliance (blocks deployment)
 * - warn: Warning only (should be addressed)
 * - info: Informational (nice to fix)
 */
export type Severity = "error" | "warn" | "info";

/**
 * Tier of the checklist item that produced this finding.
 * Determined by which checklist array the item was placed in.
 * - core: Must-have patterns; failing items are errors by default.
 * - recommended: Should-have patterns; failing items are warnings by default.
 * - optional: Nice-to-have patterns for hardened repos.
 */
export type Tier = "core" | "recommended" | "optional";

/**
 * Classification of how a finding should be remediated.
 * - mechanical: Can be fixed automatically with deterministic rules
 * - ai: Requires AI assistance for intelligent remediation
 * - human: Requires human judgment and approval
 */
export type RemediationClass = "mechanical" | "ai" | "human";

/**
 * Risk level associated with a finding.
 * - low: Minimal impact, cosmetic or minor issues
 * - medium: Moderate impact, should be addressed
 * - high: Significant impact, needs prompt attention
 * - critical: Severe impact, blocks deployment
 */
export type RiskLevel = "low" | "medium" | "high" | "critical";

/**
 * Estimated scope of changes required to remediate the finding.
 * - single-file: Fix contained to one file
 * - multi-file: Fix spans multiple files in same area
 * - cross-cutting: Fix requires changes across multiple systems/areas
 */
export type EstimatedScope = "single-file" | "multi-file" | "cross-cutting";

/**
 * A specific compliance violation detected during verification.
 * Findings include all metadata needed for routing to appropriate remediation.
 */
export interface Finding {
  /** Unique identifier for this finding (UUID v4) */
  finding_id: string;

  /** Reference to the standards rule that was violated */
  rule_id: string;

  /** Severity of the violation */
  severity: Severity;

  /** Tier of the checklist item that produced this finding */
  tier: Tier;

  /** Short title describing the finding */
  title: string;

  /** Detailed description of the violation */
  description: string;

  /** Affected file path (if applicable) */
  file_path?: string;

  /** Affected line number (if applicable) */
  line_number?: number;

  // Routing metadata (for conductor)

  /** Classification of remediation approach */
  remediation_class: RemediationClass;

  /** Actionable hint for how to remediate this finding */
  remediation_hint: string;

  /** Risk level associated with this finding */
  risk: RiskLevel;

  /** Estimated scope of changes needed */
  estimated_scope: EstimatedScope;

  /** Confidence in the classification (0-1) */
  confidence: number;

  // Timestamps

  /** When the finding was detected (ISO 8601 UTC) */
  detected_at: string;
}
