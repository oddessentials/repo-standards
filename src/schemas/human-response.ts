// src/schemas/human-response.ts
// Human-in-loop response schemas for approval workflows

/**
 * Actions a human can take in response to a finding.
 */
export type HumanAction = "approve" | "reject" | "defer" | "escalate";

/**
 * Response from a human for findings requiring human judgment.
 */
export interface HumanResponse {
  /** Unique identifier for this response (UUID v4) */
  response_id: string;

  /** Session this response belongs to */
  session_id: string;

  /** Finding IDs this response addresses */
  finding_ids: string[];

  /** Action taken by the human */
  action: HumanAction;

  /** Identifier of the responding user */
  responder_id: string;

  /** When the response was received (ISO 8601 UTC) */
  responded_at: string;

  /** Optional comment explaining the decision */
  comment?: string;

  // Validation

  /** Whether the response was received within the timeout window */
  within_timeout: boolean;

  /** Whether the responder's authorization was verified */
  authorization_verified: boolean;
}
