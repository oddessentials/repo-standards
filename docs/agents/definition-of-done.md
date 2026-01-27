# Agent Definition of Done (Quality Gates)

> **Status:** Normative
> **Scope:** All AI agents operating within the repo-standards ecosystem
> **Purpose:** Define criteria that MUST be satisfied before work is considered complete

---

## Overview

Quality gates define the **Definition of Done** for agent operations. Each gate specifies criteria that MUST be satisfied before transitioning to the next phase or declaring work complete.

**Principle:** Work is not done until the gate is passed. Partial completion does not count.

---

## Gate Classification

| Gate Type      | Purpose                                   | Enforcement       |
| -------------- | ----------------------------------------- | ----------------- |
| **Entry Gate** | Prerequisites before starting work        | Automated check   |
| **Phase Gate** | Requirements to transition between phases | Automated + Human |
| **Exit Gate**  | Criteria for declaring completion         | Automated + Audit |

---

## Entry Gates

Entry gates define what MUST be true before an agent may begin work.

### EG-01: Session Initialization

**Purpose:** Ensure proper context before any operation.

| Criterion                       | Verification                                     | Required |
| ------------------------------- | ------------------------------------------------ | -------- |
| Repository path is valid        | `test -d <repo_path>`                            | Yes      |
| Repository is a git repository  | `test -d <repo_path>/.git`                       | Yes      |
| Standards version is resolvable | `.odd/standards.toml` exists OR explicit version | Yes      |
| Required packs are available    | Pack identifiers resolve in repo-standards       | Yes      |
| Session ID is generated         | UUID v4 assigned                                 | Yes      |
| Audit log is initialized        | Log file created with session header             | Yes      |
| Agent has required permissions  | Read/write access verified                       | Yes      |

**Gate Status:** All criteria must pass to proceed.

```typescript
interface SessionInitGate {
  repo_path_valid: boolean;
  is_git_repo: boolean;
  standards_version_resolved: boolean;
  packs_available: boolean;
  session_id_generated: boolean;
  audit_log_initialized: boolean;
  permissions_verified: boolean;
}
```

---

### EG-02: Verification Baseline

**Purpose:** Establish current compliance state before changes.

| Criterion                      | Verification                            | Required |
| ------------------------------ | --------------------------------------- | -------- |
| Initial verification completed | `repo-standards verify` executed        | Yes      |
| VerifyResult captured          | JSON payload stored in session          | Yes      |
| Findings classified            | Each finding has remediation routing    | Yes      |
| Input hash recorded            | `input_hash` stored for reproducibility | Yes      |
| Baseline state documented      | Current compliance status logged        | Yes      |

**Gate Status:** Baseline must be established before any remediation.

---

### EG-03: Remediation Authorization

**Purpose:** Ensure remediation is warranted and authorized.

| Criterion                       | Verification                       | Required |
| ------------------------------- | ---------------------------------- | -------- |
| Verification failed             | `is_compliant === false`           | Yes      |
| Findings exist                  | `findings.length > 0`              | Yes      |
| No human-only findings blocking | Or human approval obtained         | Yes      |
| Within budget limits            | Token/time budget available        | Yes      |
| No active safety stops          | Previous session completed cleanly | Yes      |

**Gate Status:** Cannot begin remediation without failing verification.

---

## Phase Gates

Phase gates define what MUST be true to transition between operational phases.

### PG-01: Spec → Apply

**Purpose:** Ensure specification is complete before applying standards.

| Criterion                    | Verification                  | Required |
| ---------------------------- | ----------------------------- | -------- |
| `.odd/standards.toml` exists | File presence check           | Yes      |
| Standards version is valid   | Semver format, version exists | Yes      |
| Packs are declared           | At least one pack specified   | Yes      |
| Configuration is valid       | TOML parses without error     | Yes      |
| Session record updated       | Spec phase logged             | Yes      |

**Approval:** Automated

**Evidence:**

- Valid `.odd/standards.toml`
- Session log with spec phase completion

---

### PG-02: Apply → Verify

**Purpose:** Ensure standards are applied before verification.

| Criterion                        | Verification                 | Required |
| -------------------------------- | ---------------------------- | -------- |
| `repo-standards apply` succeeded | Exit code 0                  | Yes      |
| Apply report captured            | Structured report in session | Yes      |
| File modifications recorded      | Git diff or file list        | Yes      |
| No unexpected errors             | Apply log clean              | Yes      |
| Session record updated           | Apply phase logged           | Yes      |

**Approval:** Automated

**Evidence:**

- Apply report JSON
- Git diff showing modifications
- Session log with apply phase completion

---

### PG-03: Verify → Remediate

**Purpose:** Ensure verification is complete before remediation begins.

| Criterion                         | Verification                 | Required |
| --------------------------------- | ---------------------------- | -------- |
| `repo-standards verify` completed | Exit code 0 or 1             | Yes      |
| VerifyResult is valid             | Schema v1.1.0 conformance    | Yes      |
| `input_hash` computed             | SHA-256 present              | Yes      |
| Findings are classified           | All have `remediation_class` | Yes      |
| Remediation queue built           | Findings ordered by strategy | Yes      |
| Human gates identified            | High-risk findings flagged   | Yes      |
| Budget allocated                  | Limits set for session       | Yes      |

**Approval:** Automated (unless human-only findings exist)

**Evidence:**

- VerifyResult JSON
- Remediation queue
- Budget allocation record

---

### PG-04: Remediate → Verify (Loop)

**Purpose:** Ensure each remediation attempt is verified.

| Criterion                        | Verification                      | Required |
| -------------------------------- | --------------------------------- | -------- |
| Remediation action completed     | Action record logged              | Yes      |
| Changes committed                | Git commit with finding reference | Yes      |
| Post-remediation verify executed | New VerifyResult captured         | Yes      |
| Finding status updated           | Resolved/partial/failed           | Yes      |
| Attempt recorded                 | Full attempt record in session    | Yes      |
| Bounds checked                   | Within attempt/token/time limits  | Yes      |

**Approval:** Automated

**Evidence:**

- Remediation attempt record
- Git commit SHA
- Updated VerifyResult

---

### PG-05: Remediate → Human Gate

**Purpose:** Ensure proper escalation when human approval required.

| Criterion                | Verification                     | Required |
| ------------------------ | -------------------------------- | -------- |
| Human gate condition met | Risk/scope/class triggers        | Yes      |
| Notification sent        | Via configured channels          | Yes      |
| Session state updated    | `AWAITING_HUMAN`                 | Yes      |
| Timeout started          | Clock begins for response window | Yes      |
| Context provided         | Finding details in notification  | Yes      |

**Approval:** Human (required)

**Evidence:**

- Notification delivery confirmation
- Session state record
- Timeout timestamp

---

## Exit Gates

Exit gates define what MUST be true to declare work complete.

### XG-01: Compliance Achieved

**Purpose:** Confirm repository is compliant.

| Criterion                    | Verification                                                | Required |
| ---------------------------- | ----------------------------------------------------------- | -------- |
| Final verification passed    | `is_compliant === true`                                     | Yes      |
| Zero error-severity findings | `findings.filter(f => f.severity === 'error').length === 0` | Yes      |
| Session outcome set          | `COMPLIANT`                                                 | Yes      |
| Audit log complete           | All phases recorded                                         | Yes      |
| Audit log sealed             | No further modifications                                    | Yes      |

**Evidence Required:**

- Final VerifyResult with `is_compliant: true`
- Complete session log
- Sealed audit record

---

### XG-02: Human Escalation Complete

**Purpose:** Confirm proper escalation when human intervention required.

| Criterion                            | Verification                    | Required |
| ------------------------------------ | ------------------------------- | -------- |
| All human-required findings surfaced | Notification sent for each      | Yes      |
| Notifications delivered              | Delivery confirmation           | Yes      |
| Session state correct                | `AWAITING_HUMAN`                | Yes      |
| Escalation timeline documented       | Timeout and escalation times    | Yes      |
| Context complete                     | Findings with remediation hints | Yes      |

**Evidence Required:**

- Notification records
- Session state `AWAITING_HUMAN`
- Escalation timeline

---

### XG-03: Graceful Termination

**Purpose:** Confirm proper shutdown when bounds reached.

| Criterion                     | Verification                            | Required |
| ----------------------------- | --------------------------------------- | -------- |
| Stop condition identified     | Specific bound reached                  | Yes      |
| All attempts recorded         | Complete attempt history                | Yes      |
| Current state captured        | Latest VerifyResult                     | Yes      |
| Remaining findings documented | Outstanding issues listed               | Yes      |
| Session outcome correct       | `MAX_ATTEMPTS`, `BUDGET_EXCEEDED`, etc. | Yes      |
| Audit log complete            | Full session history                    | Yes      |

**Evidence Required:**

- Stop condition record
- All remediation attempts
- Outstanding findings list
- Complete audit log

---

### XG-04: Safety Stop

**Purpose:** Confirm proper halt on safety violation.

| Criterion               | Verification                | Required |
| ----------------------- | --------------------------- | -------- |
| Violation identified    | Specific invariant violated | Yes      |
| Immediate halt executed | No further actions taken    | Yes      |
| State preserved         | Current context captured    | Yes      |
| Human alert sent        | Notification delivered      | Yes      |
| Session outcome correct | `SAFETY_STOP`               | Yes      |
| Violation logged        | Full context in audit       | Yes      |

**Evidence Required:**

- Violation record with invariant ID
- Halt timestamp
- Human notification confirmation
- Complete violation context

---

## Remediation-Specific Gates

### RSG-01: Mechanical Fix Complete

**Purpose:** Confirm mechanical remediation is done.

| Criterion             | Verification                 | Required |
| --------------------- | ---------------------------- | -------- |
| Fix applied           | File modifications made      | Yes      |
| Changes match finding | Addresses `remediation_hint` | Yes      |
| No side effects       | Only target files modified   | Yes      |
| Tests pass            | `npm run test` succeeds      | Yes      |
| Verification improved | Finding resolved or reduced  | Yes      |

---

### RSG-02: AI Remediation Complete

**Purpose:** Confirm AI-assisted remediation is done.

| Criterion                 | Verification              | Required |
| ------------------------- | ------------------------- | -------- |
| AI action executed        | Agent completed task      | Yes      |
| Token budget respected    | Within `max_tokens` limit | Yes      |
| Changes committed         | Atomic commit created     | Yes      |
| Commit references finding | Finding ID in message     | Yes      |
| Post-verification run     | New VerifyResult captured | Yes      |
| Finding status determined | Resolved/partial/failed   | Yes      |

---

### RSG-03: Human Approval Received

**Purpose:** Confirm human has approved changes.

| Criterion            | Verification                         | Required |
| -------------------- | ------------------------------------ | -------- |
| Approval received    | `HumanResponse.action === 'approve'` | Yes      |
| Responder identified | Valid user identifier                | Yes      |
| Timestamp recorded   | ISO 8601 UTC                         | Yes      |
| Scope matches        | Approved findings match pending      | Yes      |
| Session updated      | `AWAITING_HUMAN` → next state        | Yes      |

---

## Quality Gate Checklist Format

For each operation, agents should track gate status:

```typescript
interface GateStatus {
  gate_id: string;
  gate_type: "entry" | "phase" | "exit" | "remediation";
  criteria: CriterionStatus[];
  passed: boolean;
  timestamp: string;
  evidence: Evidence[];
}

interface CriterionStatus {
  criterion: string;
  passed: boolean;
  value?: unknown;
  error?: string;
}

interface Evidence {
  type: string;
  location: string; // File path, URL, or session reference
  hash?: string; // Content hash for integrity
}
```

---

## Gate Verification Commands

```bash
# Entry gate verification
npm run verify                    # Full verification for EG-02
test -f .odd/standards.toml      # EG-01 standards config

# Phase gate verification
npm run check                     # Static checks
npm run test                      # Test suite
npm run security                  # Security scanning
npm run policy                    # Policy enforcement

# Exit gate verification
npm run verify                    # Final compliance check
git log --oneline -10            # Commit history for audit
```

---

## Gate Dependencies

```
EG-01 (Session Init)
  ↓
EG-02 (Baseline)
  ↓
EG-03 (Authorization)
  ↓
PG-01 (Spec → Apply)
  ↓
PG-02 (Apply → Verify)
  ↓
PG-03 (Verify → Remediate)
  ↓
  ┌─────────────────────┐
  │ Remediation Loop    │
  │ PG-04 (Rem → Verify)│
  │ RSG-01/02/03        │
  └─────────────────────┘
  ↓
  ├── XG-01 (Compliant)
  ├── XG-02 (Human Escalation)
  ├── XG-03 (Graceful Term)
  └── XG-04 (Safety Stop)
```

---

## Notes

- **All criteria must pass** — Partial gate passage is not permitted
- **Evidence is mandatory** — Assertions without evidence are insufficient
- **Gates are checkpoints** — They ensure quality, not just progress
- **Failed gates block progression** — Fix issues before advancing
- **Audit everything** — Gate transitions are logged for reproducibility

---

_Definition of Done is not negotiable. Gates are passed or work continues._
