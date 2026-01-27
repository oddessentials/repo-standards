// src/session/session-manager.ts
// Session lifecycle management

import { join } from "node:path";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { v4 as uuidv4 } from "uuid";
import type {
  SessionLog,
  SessionPhase,
  SessionOutcome,
} from "../schemas/index.js";
import { SessionStateMachine } from "./state-machine.js";
import { AuditLogger } from "./audit-logger.js";

/**
 * Options for the session manager.
 */
export interface SessionManagerOptions {
  /** Path to the repository */
  repository_path: string;

  /** Standards version */
  standards_version: string;

  /** Directory to store session data (default: .odd/sessions) */
  session_dir?: string;
}

/**
 * Manages compliance session lifecycle.
 */
export class SessionManager {
  private readonly session_id: string;
  private readonly repository_path: string;
  private readonly standards_version: string;
  private readonly session_dir: string;
  private readonly state_machine: SessionStateMachine;
  private readonly audit_logger: AuditLogger;
  private started_at: string;

  constructor(options: SessionManagerOptions) {
    this.session_id = uuidv4();
    this.repository_path = options.repository_path;
    this.standards_version = options.standards_version;
    this.session_dir =
      options.session_dir || join(options.repository_path, ".odd", "sessions");
    this.started_at = new Date().toISOString();

    // Ensure session directory exists
    if (!existsSync(this.session_dir)) {
      mkdirSync(this.session_dir, { recursive: true });
    }

    // Initialize state machine
    this.state_machine = new SessionStateMachine("INIT");

    // Initialize audit logger
    const log_path = join(this.session_dir, `${this.session_id}.jsonl`);
    this.audit_logger = new AuditLogger({
      log_path,
      session_id: this.session_id,
    });

    // Log session initialization
    this.audit_logger.log(
      "session_init",
      "Initialize compliance session",
      "success",
      {
        repository_path: this.repository_path,
        standards_version: this.standards_version,
      },
    );
  }

  /** Get the session ID */
  get id(): string {
    return this.session_id;
  }

  /** Get current phase */
  get phase(): SessionPhase {
    return this.state_machine.phase;
  }

  /** Get current outcome */
  get outcome(): SessionOutcome {
    return this.state_machine.outcome;
  }

  /** Get the audit logger */
  get logger(): AuditLogger {
    return this.audit_logger;
  }

  /**
   * Transition to a new phase.
   *
   * @param phase - Target phase
   * @param reason - Reason for transition
   */
  transitionTo(phase: SessionPhase, reason: string): void {
    this.audit_logger.log(
      "phase_transition",
      `Transition from ${this.state_machine.phase} to ${phase}`,
      "success",
      { from: this.state_machine.phase, to: phase, reason },
    );

    this.state_machine.transition(phase, reason);
    this.persist();
  }

  /**
   * Log an action in the session.
   */
  log(
    action: string,
    intent: string,
    result: "success" | "failure" | "skipped",
    details?: Record<string, unknown>,
  ): void {
    this.audit_logger.log(action, intent, result, details);
  }

  /**
   * Trigger a safety stop.
   */
  safetyStop(reason: string): void {
    this.audit_logger.log(
      "safety_stop",
      "Emergency halt due to safety violation",
      "failure",
      { reason },
    );

    this.state_machine.forceOutcome("SAFETY_STOP", reason);
    this.complete();
  }

  /**
   * Complete the session.
   */
  complete(): void {
    if (!this.state_machine.isComplete()) {
      this.state_machine.transition("COMPLETE", "Session completed");
    }

    const seal_hash = this.audit_logger.seal();

    this.audit_logger.log(
      "session_complete",
      "Finalize compliance session",
      "success",
      {
        outcome: this.state_machine.outcome,
        seal_hash,
      },
    );

    this.persist();
  }

  /**
   * Build the full session log.
   */
  toSessionLog(): SessionLog {
    return {
      session_id: this.session_id,
      started_at: this.started_at,
      ended_at: this.state_machine.isComplete()
        ? new Date().toISOString()
        : undefined,
      phase: this.state_machine.phase,
      outcome: this.state_machine.outcome,
      repository_path: this.repository_path,
      standards_version: this.standards_version,
      entries: [...this.audit_logger.getEntries()],
      sealed: this.audit_logger.isSealed(),
      sealed_at: this.audit_logger.isSealed()
        ? new Date().toISOString()
        : undefined,
      seal_hash: this.audit_logger.getSealHash(),
    };
  }

  /**
   * Persist session state to disk.
   */
  private persist(): void {
    const statePath = join(this.session_dir, `${this.session_id}.state.json`);
    const state = {
      session_id: this.session_id,
      phase: this.state_machine.phase,
      outcome: this.state_machine.outcome,
      started_at: this.started_at,
      updated_at: new Date().toISOString(),
      repository_path: this.repository_path,
      standards_version: this.standards_version,
    };

    writeFileSync(statePath, JSON.stringify(state, null, 2), "utf8");
  }

  /**
   * Load an existing session.
   */
  static load(session_dir: string, session_id: string): SessionLog | null {
    const statePath = join(session_dir, `${session_id}.state.json`);
    const logPath = join(session_dir, `${session_id}.jsonl`);

    if (!existsSync(statePath)) {
      return null;
    }

    try {
      const state = JSON.parse(readFileSync(statePath, "utf8")) as {
        session_id: string;
        started_at: string;
        updated_at: string;
        phase: SessionPhase;
        outcome: SessionOutcome;
        repository_path: string;
        standards_version: string;
      };
      const entries = AuditLogger.load(logPath);

      return {
        session_id: state.session_id,
        started_at: state.started_at,
        ended_at:
          state.outcome !== "IN_PROGRESS" ? state.updated_at : undefined,
        phase: state.phase,
        outcome: state.outcome,
        repository_path: state.repository_path,
        standards_version: state.standards_version,
        entries,
        sealed: state.outcome !== "IN_PROGRESS",
      };
    } catch {
      return null;
    }
  }
}
