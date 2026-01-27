// src/session/audit-logger.ts
// Append-only audit logging for session traceability

import {
  appendFileSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import type { SessionLogEntry, ExecutionResult } from "../schemas/index.js";

/**
 * Options for the audit logger.
 */
export interface AuditLoggerOptions {
  /** Path to the log file */
  log_path: string;

  /** Session ID */
  session_id: string;
}

/**
 * Append-only audit logger for session events.
 */
export class AuditLogger {
  private readonly log_path: string;
  private readonly session_id: string;
  private entries: SessionLogEntry[];
  private sealed: boolean;
  private seal_hash?: string;

  constructor(options: AuditLoggerOptions) {
    this.log_path = options.log_path;
    this.session_id = options.session_id;
    this.entries = [];
    this.sealed = false;

    // Initialize log file with header
    this.writeHeader();
  }

  /**
   * Write log file header.
   */
  private writeHeader(): void {
    const header = {
      type: "session_header",
      session_id: this.session_id,
      started_at: new Date().toISOString(),
      version: "1.0.0",
    };

    writeFileSync(this.log_path, JSON.stringify(header) + "\n", "utf8");
  }

  /**
   * Log an action.
   *
   * @param action - What was done
   * @param intent - Why it was done
   * @param result - Result of the action
   * @param details - Additional details
   * @throws Error if log is sealed
   */
  log(
    action: string,
    intent: string,
    result: ExecutionResult,
    details?: Record<string, unknown>,
  ): SessionLogEntry {
    if (this.sealed) {
      throw new Error("Cannot log to sealed audit trail");
    }

    const entry: SessionLogEntry = {
      timestamp: new Date().toISOString(),
      correlation_id: uuidv4(),
      action,
      intent,
      execution_result: result,
      details,
    };

    this.entries.push(entry);

    // Append to log file
    appendFileSync(this.log_path, JSON.stringify(entry) + "\n", "utf8");

    return entry;
  }

  /**
   * Log with a specific correlation ID (for linking related entries).
   */
  logCorrelated(
    correlation_id: string,
    action: string,
    intent: string,
    result: ExecutionResult,
    details?: Record<string, unknown>,
  ): SessionLogEntry {
    if (this.sealed) {
      throw new Error("Cannot log to sealed audit trail");
    }

    const entry: SessionLogEntry = {
      timestamp: new Date().toISOString(),
      correlation_id,
      action,
      intent,
      execution_result: result,
      details,
    };

    this.entries.push(entry);
    appendFileSync(this.log_path, JSON.stringify(entry) + "\n", "utf8");

    return entry;
  }

  /**
   * Seal the audit log (no further modifications allowed).
   *
   * @returns Seal hash for integrity verification
   */
  seal(): string {
    if (this.sealed) {
      return this.seal_hash!;
    }

    // Compute hash of all entries
    const content = this.entries.map((e) => JSON.stringify(e)).join("\n");
    this.seal_hash = createHash("sha256").update(content).digest("hex");
    this.sealed = true;

    // Write seal record
    const sealRecord = {
      type: "session_seal",
      session_id: this.session_id,
      sealed_at: new Date().toISOString(),
      entry_count: this.entries.length,
      seal_hash: this.seal_hash,
    };

    appendFileSync(this.log_path, JSON.stringify(sealRecord) + "\n", "utf8");

    return this.seal_hash;
  }

  /**
   * Get all entries.
   */
  getEntries(): ReadonlyArray<SessionLogEntry> {
    return this.entries;
  }

  /**
   * Check if the log is sealed.
   */
  isSealed(): boolean {
    return this.sealed;
  }

  /**
   * Get the seal hash (only available after sealing).
   */
  getSealHash(): string | undefined {
    return this.seal_hash;
  }

  /**
   * Load entries from an existing log file.
   */
  static load(log_path: string): SessionLogEntry[] {
    if (!existsSync(log_path)) {
      return [];
    }

    const content = readFileSync(log_path, "utf8");
    const lines = content.trim().split("\n");
    const entries: SessionLogEntry[] = [];

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line) as Record<string, unknown>;
        // Skip header and seal records
        if (
          parsed.type === "session_header" ||
          parsed.type === "session_seal"
        ) {
          continue;
        }
        if (parsed.timestamp && parsed.action) {
          entries.push(parsed as unknown as SessionLogEntry);
        }
      } catch {
        // Skip invalid lines
      }
    }

    return entries;
  }
}
