// src/session/state-machine.ts
// Session state machine for compliance lifecycle

import type { SessionPhase, SessionOutcome } from "../schemas/index.js";

/**
 * Record of a state transition.
 */
export interface StateTransition {
  /** Previous phase */
  from: SessionPhase;

  /** New phase */
  to: SessionPhase;

  /** When the transition occurred (ISO 8601 UTC) */
  timestamp: string;

  /** Reason for the transition */
  reason: string;
}

/**
 * Valid transitions between phases.
 */
const VALID_TRANSITIONS: Record<SessionPhase, SessionPhase[]> = {
  INIT: ["SPEC"],
  SPEC: ["APPLY"],
  APPLY: ["VERIFY"],
  VERIFY: ["REMEDIATE", "COMPLETE"],
  REMEDIATE: ["VERIFY", "AWAIT_HUMAN", "COMPLETE"],
  AWAIT_HUMAN: ["REMEDIATE", "COMPLETE"],
  COMPLETE: [], // Terminal state
};

/**
 * Outcome for each terminal transition.
 */
const TERMINAL_OUTCOMES: Record<string, SessionOutcome> = {
  "VERIFY->COMPLETE:compliant": "COMPLIANT",
  "REMEDIATE->COMPLETE:max_attempts": "MAX_ATTEMPTS",
  "REMEDIATE->COMPLETE:budget_exceeded": "BUDGET_EXCEEDED",
  "REMEDIATE->COMPLETE:safety_stop": "SAFETY_STOP",
  "AWAIT_HUMAN->COMPLETE:approved": "COMPLIANT",
  "AWAIT_HUMAN->COMPLETE:rejected": "AWAITING_HUMAN",
};

/**
 * State machine for session phase management.
 */
export class SessionStateMachine {
  private _phase: SessionPhase;
  private _outcome: SessionOutcome;
  private _transitions: StateTransition[];

  constructor(initialPhase: SessionPhase = "INIT") {
    this._phase = initialPhase;
    this._outcome = "IN_PROGRESS";
    this._transitions = [];
  }

  /** Current phase */
  get phase(): SessionPhase {
    return this._phase;
  }

  /** Current outcome */
  get outcome(): SessionOutcome {
    return this._outcome;
  }

  /** History of transitions */
  get transitions(): ReadonlyArray<StateTransition> {
    return this._transitions;
  }

  /**
   * Check if a transition is valid.
   */
  canTransition(to: SessionPhase): boolean {
    return VALID_TRANSITIONS[this._phase].includes(to);
  }

  /**
   * Get valid next phases from current state.
   */
  validNextPhases(): SessionPhase[] {
    return [...VALID_TRANSITIONS[this._phase]];
  }

  /**
   * Transition to a new phase.
   *
   * @param to - Target phase
   * @param reason - Reason for the transition
   * @throws Error if transition is invalid
   */
  transition(to: SessionPhase, reason: string): void {
    if (!this.canTransition(to)) {
      throw new Error(
        `Invalid transition from ${this._phase} to ${to}. Valid targets: ${VALID_TRANSITIONS[this._phase].join(", ") || "none"}`,
      );
    }

    const transition: StateTransition = {
      from: this._phase,
      to,
      timestamp: new Date().toISOString(),
      reason,
    };

    this._transitions.push(transition);
    this._phase = to;

    // Update outcome for terminal transitions
    if (to === "COMPLETE") {
      const key = `${transition.from}->COMPLETE:${reason}`;
      this._outcome = TERMINAL_OUTCOMES[key] || "COMPLIANT";
    } else if (to === "AWAIT_HUMAN") {
      this._outcome = "AWAITING_HUMAN";
    }
  }

  /**
   * Check if the session is in a terminal state.
   */
  isComplete(): boolean {
    return this._phase === "COMPLETE";
  }

  /**
   * Force a specific outcome (for safety stops).
   */
  forceOutcome(outcome: SessionOutcome, reason: string): void {
    this._outcome = outcome;
    if (outcome === "SAFETY_STOP") {
      this._transitions.push({
        from: this._phase,
        to: "COMPLETE",
        timestamp: new Date().toISOString(),
        reason: `SAFETY STOP: ${reason}`,
      });
      this._phase = "COMPLETE";
    }
  }
}
