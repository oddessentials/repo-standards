# Agent Victory Gates (Verification Requirements)

> **Status:** Normative
> **Scope:** All AI agents operating within the repo-standards ecosystem
> **Purpose:** Define criteria for successful mission completion

---

## Overview

Victory gates define what constitutes **successful completion** of an agent's mission. Unlike quality gates (which are checkpoints along the way), victory gates represent the final verification that the mission objective has been achieved.

**Principle:** Victory is declared when verification requirements are satisfied. Effort without outcome is not victory.

---

## Victory Gate Structure

Each victory gate includes:

- **Gate ID**: Unique identifier (VG-XXX)
- **Mission**: The objective being completed
- **Victory Condition**: The definitive success criterion
- **Verification Requirements**: What must be verified
- **Evidence Requirements**: Proof that must be collected
- **Acceptance Criteria**: Checklist for declaring victory

---

## Primary Victory Gates

### VG-001: Compliance Victory

**Mission:** Achieve repository compliance with declared standards.

**Victory Condition:**

```typescript
VerifyResult.is_compliant === true;
```

This is the **only** definition of compliance victory. No other interpretation is valid.

**Verification Requirements:**

| Requirement                  | Verification                                                | Weight    |
| ---------------------------- | ----------------------------------------------------------- | --------- |
| Final `verify` passes        | `repo-standards verify` returns `is_compliant: true`        | Mandatory |
| Zero error-severity findings | `findings.filter(f => f.severity === 'error').length === 0` | Mandatory |
| All findings addressed       | Each finding is resolved, approved, or out-of-scope         | Mandatory |
| Input hash stable            | Repeated verification produces same `input_hash`            | Mandatory |
| Session outcome correct      | `outcome === 'COMPLIANT'`                                   | Mandatory |

**Evidence Requirements:**

- [ ] Final `VerifyResult` JSON with `is_compliant: true`
- [ ] Session audit log showing all phases completed
- [ ] Git history showing remediation commits
- [ ] Finding resolution records (resolved, approved, or documented exclusion)

**Acceptance Criteria:**

```
□ repo-standards verify returns is_compliant: true
□ Zero error-severity findings in final VerifyResult
□ All remediation attempts are recorded
□ Audit log is complete and sealed
□ Session outcome is COMPLIANT
```

---

### VG-002: Human Escalation Victory

**Mission:** Successfully escalate issues requiring human judgment.

**Victory Condition:**

All human-required findings have been surfaced with complete context, and the session is properly awaiting human response.

**Verification Requirements:**

| Requirement                | Verification                                                      | Weight    |
| -------------------------- | ----------------------------------------------------------------- | --------- |
| All human gates triggered  | Findings with `remediation_class: human` or `risk: high` surfaced | Mandatory |
| Notifications delivered    | Delivery confirmation for each channel                            | Mandatory |
| Context complete           | Each notification includes finding details and remediation hints  | Mandatory |
| Session state correct      | `outcome === 'AWAITING_HUMAN'`                                    | Mandatory |
| Escalation timeline active | Timeout and escalation timestamps set                             | Mandatory |

**Evidence Requirements:**

- [ ] Notification delivery confirmations (PR comment ID, Slack message ID, etc.)
- [ ] Session state showing `AWAITING_HUMAN`
- [ ] List of findings pending human review with full context
- [ ] Escalation timeline (T+0, T+12h, T+24h timestamps)

**Acceptance Criteria:**

```
□ All human-required findings have notifications sent
□ Notifications include: finding ID, description, remediation hint, risk level
□ Session state is AWAITING_HUMAN
□ Escalation timeline is documented
□ No further agent actions are pending
```

---

### VG-003: Graceful Termination Victory

**Mission:** Properly terminate when execution bounds are reached.

**Victory Condition:**

Execution has stopped at a defined boundary with complete state preservation and proper documentation.

**Verification Requirements:**

| Requirement                     | Verification                                                   | Weight    |
| ------------------------------- | -------------------------------------------------------------- | --------- |
| Stop condition is valid         | One of: `MAX_ATTEMPTS`, `BUDGET_EXCEEDED`, `NEEDS_HUMAN_STALE` | Mandatory |
| All attempts recorded           | Complete history of remediation attempts                       | Mandatory |
| Current state captured          | Latest `VerifyResult` stored                                   | Mandatory |
| Outstanding findings documented | List of unresolved findings                                    | Mandatory |
| Audit log complete              | All phases and attempts logged                                 | Mandatory |

**Evidence Requirements:**

- [ ] Stop condition record with specific trigger
- [ ] Complete remediation attempt history
- [ ] Final `VerifyResult` (even if not compliant)
- [ ] List of outstanding findings with status
- [ ] Sealed audit log

**Acceptance Criteria:**

```
□ Stop condition is identified and documented
□ Attempt count matches expected bounds
□ Current compliance state is captured
□ Outstanding findings are enumerated
□ Audit log covers entire session
□ Session outcome matches stop condition
```

---

### VG-004: Safety Stop Victory

**Mission:** Properly halt when a safety invariant is violated.

**Victory Condition:**

Execution has immediately halted, state is preserved, and humans are alerted.

**Verification Requirements:**

| Requirement          | Verification                                  | Weight    |
| -------------------- | --------------------------------------------- | --------- |
| Violation identified | Specific invariant ID documented              | Mandatory |
| Immediate halt       | No actions after violation detected           | Mandatory |
| State preserved      | Session context captured at halt              | Mandatory |
| Human alert sent     | Notification delivered to escalation channels | Mandatory |
| No retry attempted   | Agent did not attempt to continue             | Mandatory |

**Evidence Requirements:**

- [ ] Violation record with invariant ID (e.g., `INV-A03`)
- [ ] Timestamp of violation detection
- [ ] Timestamp of halt (must be same or immediately after detection)
- [ ] Human notification delivery confirmation
- [ ] Session state showing `SAFETY_STOP`

**Acceptance Criteria:**

```
□ Invariant violation is clearly identified
□ Halt occurred immediately (< 1 second after detection)
□ No actions were taken after violation
□ Human alert was sent within 1 minute
□ Session outcome is SAFETY_STOP
□ Full violation context is logged
```

---

### VG-005: Session Reproducibility Victory

**Mission:** Ensure the session can be reproduced with identical results.

**Victory Condition:**

Given the same inputs, the session would produce the same outputs.

**Verification Requirements:**

| Requirement                | Verification                             | Weight    |
| -------------------------- | ---------------------------------------- | --------- |
| Input hash matches         | `input_hash` is identical across runs    | Mandatory |
| VerifyResult deterministic | Same inputs produce same findings        | Mandatory |
| Routing deterministic      | Same findings produce same routing       | Mandatory |
| Audit enables replay       | Sufficient detail for reconstruction     | Mandatory |
| No external dependencies   | No network calls or time-based decisions | Mandatory |

**Evidence Requirements:**

- [ ] `input_hash` recorded at session start
- [ ] `VerifyResult` comparison (if re-run)
- [ ] Routing decision records
- [ ] Complete audit log with all inputs/outputs
- [ ] Determinism verification (optional: run twice, compare)

**Acceptance Criteria:**

```
□ input_hash is recorded and stable
□ All verification results are captured
□ All routing decisions are logged with inputs
□ Audit log contains sufficient detail for replay
□ No randomness or external state in decisions
```

---

## Remediation-Specific Victory Gates

### VG-R01: Mechanical Remediation Victory

**Mission:** Successfully remediate a finding using mechanical (deterministic) fixes.

**Victory Condition:**

The finding is resolved by applying a deterministic fix, verified by re-running verification.

**Verification Requirements:**

| Requirement         | Verification                              | Weight    |
| ------------------- | ----------------------------------------- | --------- |
| Fix applied         | File modifications match expected changes | Mandatory |
| Changes are minimal | Only target files modified                | Mandatory |
| Tests pass          | `npm run test` succeeds                   | Mandatory |
| Finding resolved    | Post-verification shows finding gone      | Mandatory |
| No regressions      | No new findings introduced                | Required  |

**Acceptance Criteria:**

```
□ Mechanical fix was applied
□ Only expected files were modified
□ Test suite passes
□ Target finding no longer appears in verification
□ No new error-severity findings introduced
```

---

### VG-R02: AI Remediation Victory

**Mission:** Successfully remediate a finding using AI-assisted changes.

**Victory Condition:**

The finding is resolved by AI-generated changes, within budget, verified by re-running verification.

**Verification Requirements:**

| Requirement               | Verification                         | Weight    |
| ------------------------- | ------------------------------------ | --------- |
| AI action completed       | Agent task finished                  | Mandatory |
| Within token budget       | `tokens_used <= max_tokens`          | Mandatory |
| Changes committed         | Atomic commit created                | Mandatory |
| Commit references finding | Finding ID in commit message         | Mandatory |
| Finding resolved          | Post-verification shows finding gone | Mandatory |
| Tests pass                | `npm run test` succeeds              | Mandatory |

**Acceptance Criteria:**

```
□ AI remediation completed within budget
□ Changes are committed atomically
□ Commit message references finding ID
□ Post-verification shows finding resolved
□ Test suite passes
□ No new error-severity findings introduced
```

---

### VG-R03: Human Approval Victory

**Mission:** Obtain human approval for changes requiring human judgment.

**Victory Condition:**

Human has explicitly approved the changes via configured response mechanism.

**Verification Requirements:**

| Requirement         | Verification                         | Weight    |
| ------------------- | ------------------------------------ | --------- |
| Approval received   | `HumanResponse.action === 'approve'` | Mandatory |
| Approver identified | Valid user identifier in response    | Mandatory |
| Scope matches       | Approved findings match requested    | Mandatory |
| Timestamp valid     | Within timeout window                | Mandatory |
| Response recorded   | Full response in audit log           | Mandatory |

**Acceptance Criteria:**

```
□ Human response received with action: approve
□ Responder is identified and authorized
□ Approved scope matches pending findings
□ Response received within timeout window
□ Full response is recorded in audit log
```

---

## Victory Gate Verification Protocol

### Pre-Declaration Checklist

Before declaring any victory:

1. **Verify all mandatory requirements** — Every mandatory item must pass
2. **Collect all evidence** — Every evidence item must be present
3. **Complete acceptance criteria** — Every checkbox must be satisfied
4. **Seal audit log** — No further modifications allowed
5. **Record victory declaration** — Timestamp and gate ID logged

### Victory Declaration Schema

```typescript
interface VictoryDeclaration {
  gate_id: string; // e.g., "VG-001"
  mission: string; // Human-readable mission
  declared_at: string; // ISO 8601 UTC
  session_id: string; // Session that achieved victory

  verification: {
    all_requirements_passed: boolean;
    requirements: RequirementStatus[];
  };

  evidence: {
    all_evidence_collected: boolean;
    artifacts: EvidenceArtifact[];
  };

  acceptance: {
    all_criteria_satisfied: boolean;
    criteria: CriterionStatus[];
  };

  audit_sealed: boolean;
  declaration_valid: boolean; // Computed: all above are true
}

interface RequirementStatus {
  requirement: string;
  passed: boolean;
  verification_method: string;
  result?: unknown;
}

interface EvidenceArtifact {
  description: string;
  location: string; // File path, URL, or reference
  collected: boolean;
  hash?: string; // Content hash for integrity
}

interface CriterionStatus {
  criterion: string;
  satisfied: boolean;
}
```

---

## Victory Gate Hierarchy

```
                    ┌─────────────────┐
                    │   VG-005        │
                    │ Reproducibility │
                    └────────┬────────┘
                             │ (cross-cutting)
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    VG-001       │ │    VG-002       │ │    VG-003       │
│   Compliance    │ │ Human Escalation│ │Graceful Termn.  │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         │                   │                   │
    ┌────┴────┐         ┌────┴────┐         ┌────┴────┐
    │ VG-R01  │         │ VG-R03  │         │ VG-004  │
    │ VG-R02  │         │ Human   │         │ Safety  │
    │ Remed.  │         │ Approval│         │  Stop   │
    └─────────┘         └─────────┘         └─────────┘
```

---

## Victory vs. Failure

| Outcome        | Victory Gate | Failure Mode                                |
| -------------- | ------------ | ------------------------------------------- |
| Compliant      | VG-001       | Did not achieve `is_compliant: true`        |
| Escalated      | VG-002       | Failed to notify humans                     |
| Terminated     | VG-003       | Bound exceeded without proper state capture |
| Safety Stopped | VG-004       | Continued after violation                   |
| Reproducible   | VG-005       | Non-deterministic behavior detected         |

**Note:** Graceful termination (VG-003) and Safety Stop (VG-004) are valid victories, not failures. The agent successfully operated within its boundaries. Failure occurs when these gates are not properly satisfied.

---

## Verification Commands

```bash
# Verify compliance victory (VG-001)
npm run verify
# Expected: is_compliant: true, zero error-severity findings

# Check session state for escalation victory (VG-002)
# Session outcome should be AWAITING_HUMAN

# Validate audit completeness (all gates)
# Audit log should cover all phases and attempts

# Test reproducibility (VG-005)
npm run verify > result1.json
npm run verify > result2.json
diff result1.json result2.json
# Expected: identical (excluding timestamps)
```

---

## Notes

- **Victory requires verification** — Assertions without proof are invalid
- **Multiple victories possible** — A session may achieve VG-001 after VG-R01 + VG-R02
- **Graceful termination is victory** — Properly bounded behavior is success
- **Safety stops are victory** — Correct halt on violation is correct behavior
- **Evidence must be preserved** — Victory declarations reference immutable artifacts

---

_Victory is not claimed. Victory is verified._
