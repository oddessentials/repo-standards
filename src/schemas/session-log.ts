// src/schemas/session-log.ts
// Session management schemas for compliance lifecycle tracking

/**
 * Phases of a compliance session.
 */
export type SessionPhase =
  | "INIT"
  | "SPEC"
  | "APPLY"
  | "VERIFY"
  | "REMEDIATE"
  | "AWAIT_HUMAN"
  | "COMPLETE";

/**
 * Possible outcomes of a compliance session.
 */
export type SessionOutcome =
  | "COMPLIANT"
  | "AWAITING_HUMAN"
  | "MAX_ATTEMPTS"
  | "BUDGET_EXCEEDED"
  | "SAFETY_STOP"
  | "IN_PROGRESS";

/**
 * Result of executing an action.
 */
export type ExecutionResult = "success" | "failure" | "skipped";

/**
 * Individual entry in the session audit log.
 */
export interface SessionLogEntry {
  /** When this action occurred (ISO 8601 UTC) */
  timestamp: string;

  /** Correlation ID linking related entries */
  correlation_id: string;

  /** What action was performed */
  action: string;

  /** Why the action was performed */
  intent: string;

  /** Result of the action */
  execution_result: ExecutionResult;

  /** Additional details about the action */
  details?: Record<string, unknown>;
}

/**
 * Complete session log for a compliance lifecycle run.
 */
export interface SessionLog {
  /** Unique session identifier (UUID v4) */
  session_id: string;

  /** When the session started (ISO 8601 UTC) */
  started_at: string;

  /** When the session ended (ISO 8601 UTC), if complete */
  ended_at?: string;

  /** Current phase of the session */
  phase: SessionPhase;

  /** Current or final outcome of the session */
  outcome: SessionOutcome;

  // Context

  /** Path to the repository being processed */
  repository_path: string;

  /** Standards version in use */
  standards_version: string;

  // Audit trail

  /** Ordered list of log entries */
  entries: SessionLogEntry[];

  // Sealing

  /** Whether the log has been sealed (no further modifications) */
  sealed: boolean;

  /** When the log was sealed (ISO 8601 UTC) */
  sealed_at?: string;

  /** Hash of all entries for integrity verification */
  seal_hash?: string;
}
