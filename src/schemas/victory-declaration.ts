// src/schemas/victory-declaration.ts
// Victory gate schemas for mission completion verification

/**
 * Status of a verification requirement.
 */
export interface RequirementStatus {
  /** Description of the requirement */
  requirement: string;

  /** Whether the requirement was satisfied */
  passed: boolean;

  /** How the requirement was verified */
  verification_method: string;

  /** Result of verification (for debugging) */
  result?: unknown;
}

/**
 * Evidence artifact collected for victory declaration.
 */
export interface EvidenceArtifact {
  /** Description of what this evidence proves */
  description: string;

  /** Location of the artifact (file path, URL, or reference) */
  location: string;

  /** Whether the artifact was successfully collected */
  collected: boolean;

  /** Content hash for integrity verification */
  hash?: string;
}

/**
 * Status of an acceptance criterion.
 */
export interface CriterionCheck {
  /** The acceptance criterion */
  criterion: string;

  /** Whether the criterion was satisfied */
  satisfied: boolean;
}

/**
 * Declaration of victory for a mission gate.
 */
export interface VictoryDeclaration {
  /** Victory gate identifier (e.g., "VG-001", "VG-R02") */
  gate_id: string;

  /** Human-readable mission description */
  mission: string;

  /** When victory was declared (ISO 8601 UTC) */
  declared_at: string;

  /** Session that achieved this victory */
  session_id: string;

  /** Verification of all requirements */
  verification: {
    /** Whether all requirements passed */
    all_requirements_passed: boolean;

    /** Status of each requirement */
    requirements: RequirementStatus[];
  };

  /** Evidence collection status */
  evidence: {
    /** Whether all evidence was collected */
    all_evidence_collected: boolean;

    /** List of evidence artifacts */
    artifacts: EvidenceArtifact[];
  };

  /** Acceptance criteria status */
  acceptance: {
    /** Whether all criteria were satisfied */
    all_criteria_satisfied: boolean;

    /** Status of each criterion */
    criteria: CriterionCheck[];
  };

  /** Whether the audit log was sealed before declaration */
  audit_sealed: boolean;

  /** Computed: true only if all above conditions are true */
  declaration_valid: boolean;
}
