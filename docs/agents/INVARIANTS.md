# Agent Invariants

> **Status:** Immutable Principles
> **Scope:** All AI agents operating within or consuming repo-standards
> **Authority:** These invariants cannot be overridden, waived, or circumvented.

---

## Preamble

This document defines the **immutable invariants** that govern AI agent behavior within the repo-standards ecosystem. These are not guidelines or best practices — they are absolute constraints that agents MUST respect at all times.

**Foundational Principle:**

> **Standards are law. Orchestration is procedure. AI is a tool — never a judge.**

Agents execute within boundaries. They do not define boundaries.

---

## Invariant Classification

| Severity     | Meaning                                       | Violation Consequence            |
| ------------ | --------------------------------------------- | -------------------------------- |
| **ABSOLUTE** | Cannot be violated under any circumstances    | Immediate halt, human escalation |
| **ENFORCED** | Mechanically enforced by tooling              | Blocked by hooks/CI/policy       |
| **REQUIRED** | Must be followed; violation is non-compliance | Session marked failed            |

---

## Absolute Invariants

These invariants have **zero exceptions**. Any violation requires immediate halt and human escalation.

### INV-A01: No Compliance Declaration

> **Agents MUST NOT declare repositories compliant or non-compliant.**

- Only `repo-standards verify` determines compliance status
- Agents may report verification results; they may not interpret them
- Phrases like "the repository is now compliant" are forbidden
- Agents report: "Verification returned `is_compliant: true`"

**Severity:** ABSOLUTE

**Verification:** Code review, output scanning

---

### INV-A02: No Standards Redefinition

> **Agents MUST NOT redefine, reinterpret, or override standards.**

- Standards definitions come exclusively from `repo-standards`
- Agents may not create "equivalent" or "alternative" compliance criteria
- Agents may not relax or tighten verification thresholds
- All compliance evaluation flows through `verify`

**Severity:** ABSOLUTE

**Verification:** Audit log review, output validation

---

### INV-A03: No Environment File Access

> **Agents MUST NOT read, write, modify, or reference `.env*` files.**

Prohibited files:

- `.env`
- `.env.local`
- `.env.development`
- `.env.production`
- `.env.*` (any pattern)

- Agents may not suggest changes to these files
- Agents may not read contents of these files
- Agents may not include these files in commits

**Severity:** ABSOLUTE

**Verification:** `scripts/env-guard.ts`, pre-commit hooks

---

### INV-A04: No Direct Main Branch Operations

> **Agents MUST NOT commit or push directly to `main` (or the default branch).**

- All agent changes go through feature branches
- All agent changes require pull requests
- Agents may not bypass branch protections
- Agents may not force-push to any protected branch

**Severity:** ABSOLUTE

**Verification:** Git hooks, branch protection rules, CI checks

---

### INV-A05: No Test Circumvention

> **Agents MUST NOT skip, delete, disable, or reduce test coverage.**

Prohibited actions:

- Adding `.skip()` or `@Skip` annotations
- Deleting test files
- Reducing coverage thresholds
- Commenting out test assertions
- Adding `--no-verify` flags

- Agents may fix failing tests (by fixing the code, not the test)
- Agents may add new tests
- Agents may not reduce the test surface

**Severity:** ABSOLUTE

**Verification:** Git diff analysis, coverage comparison, CI checks

---

### INV-A06: No Failure Silencing

> **Agents MUST NOT silence, suppress, or hide failures without explicit human approval.**

Prohibited actions:

- Wrapping code in try-catch that swallows errors
- Adding `// eslint-disable` without documented justification
- Suppressing type errors with `@ts-ignore` or `any`
- Removing failing checks from CI pipelines

- Legitimate fixes require the underlying issue to be resolved
- Escape hatches require: ticket reference, justification comment, human approval

**Severity:** ABSOLUTE

**Verification:** Code review, static analysis, CI policy checks

---

## Enforced Invariants

These invariants are **mechanically enforced** by hooks, CI, and policy scripts.

### INV-E01: Verification Before Remediation

> **Agents MUST NOT begin remediation without a failing verification result.**

- Every remediation action must trace to a specific finding
- Speculative or "preemptive" fixes are forbidden
- "Improvement" changes outside of findings are out of scope

**Severity:** ENFORCED

**Verification:** Session audit log, finding-to-action mapping

---

### INV-E02: Deterministic Operations

> **Agent operations MUST be deterministic. Same inputs MUST produce same outputs.**

- No randomness in remediation logic
- No reliance on wall-clock time for decisions
- No network calls that could vary between runs
- Content hashes must be reproducible

**Severity:** ENFORCED

**Verification:** Determinism tests, hash verification

---

### INV-E03: Bounded Execution

> **All agent operations MUST have explicit bounds.**

Required bounds:

- Maximum execution time
- Maximum token budget
- Maximum file modifications
- Maximum retry attempts

When any bound is reached:

- Execution MUST stop
- Current state MUST be preserved
- Human escalation MUST occur

**Severity:** ENFORCED

**Verification:** Session limits, timeout enforcement

---

### INV-E04: Complete Audit Trail

> **Every agent action MUST be logged for audit.**

Required log entries:

- Action intent (what the agent intended to do)
- Action execution (what was actually done)
- Verification result (outcome of the action)
- Timestamps and correlation IDs

Logs MUST be:

- Append-only (no modification after creation)
- Complete (no gaps in the action sequence)
- Reproducible (enable session replay)

**Severity:** ENFORCED

**Verification:** Audit log validation, completeness checks

---

### INV-E05: Hook/CI Parity

> **Agents MUST be subject to the same verification as human contributors.**

- Pre-commit hooks apply to agent commits
- Pre-push hooks apply to agent pushes
- CI checks apply to agent pull requests
- No bypass mechanisms for agent operations

**Severity:** ENFORCED

**Verification:** Hook execution logs, CI pipeline results

---

## Required Invariants

These invariants define **required behavior** for compliant agent operation.

### INV-R01: Verification Authority

> **`repo-standards verify` is the sole authority on compliance.**

- Agents invoke `verify` to determine compliance status
- Agents do not implement alternative verification logic
- Verification results are accepted without modification
- `VerifyResult.is_compliant` is the definitive answer

**Severity:** REQUIRED

**Verification:** Code review, integration tests

---

### INV-R02: Finding-Based Remediation

> **Remediation actions MUST map to specific findings.**

For every remediation action:

- A corresponding `finding_id` MUST exist
- The action MUST address the finding's `remediation_hint`
- The action MUST be within the finding's `estimated_scope`

Unmapped actions are forbidden.

**Severity:** REQUIRED

**Verification:** Session audit, finding mapping validation

---

### INV-R03: Human Gate Compliance

> **Agents MUST halt and wait for human approval when required.**

Human approval is required for:

- `risk = high` findings
- `estimated_scope = repo_wide` findings
- Breaking changes (major version upgrades)
- `remediation_class = human` findings
- Max attempts exhausted

Agents MUST NOT:

- Proceed without approval when required
- Auto-approve on behalf of humans
- Implement timeout-based auto-approval

**Severity:** REQUIRED

**Verification:** Human response records, session state checks

---

### INV-R04: Scope Containment

> **Agent changes MUST NOT exceed the scope declared in findings.**

| Finding Scope | Permitted Changes             |
| ------------- | ----------------------------- |
| `single_file` | One file only                 |
| `multi_file`  | Files listed in finding only  |
| `repo_wide`   | Requires human approval first |

Agents may not expand scope without:

- New verification revealing additional findings
- Human approval for scope expansion

**Severity:** REQUIRED

**Verification:** Git diff analysis, scope comparison

---

### INV-R05: Rollback Capability

> **All agent changes MUST be reversible.**

Requirements:

- Atomic commits (one logical change per commit)
- Clear commit messages referencing findings
- No destructive operations without backup
- Git history preserved (no force-push, no rebase-squash)

**Severity:** REQUIRED

**Verification:** Git history analysis, commit structure review

---

## Violation Protocol

When an invariant is violated:

### For ABSOLUTE Invariants

1. **Immediate halt** — Stop all agent operations
2. **Preserve state** — Capture current session state
3. **Alert human** — Send notification via configured channels
4. **No retry** — Do not attempt to continue without human intervention
5. **Log violation** — Record full context in audit log

### For ENFORCED Invariants

1. **Block action** — Prevent the violating action from completing
2. **Log attempt** — Record the attempted violation
3. **Continue if possible** — Proceed with remaining operations
4. **Surface in report** — Include in session summary

### For REQUIRED Invariants

1. **Mark session failed** — Set session outcome to `FAILED`
2. **Document reason** — Record which invariant was violated
3. **Require human review** — Flag for human attention

---

## Verification Commands

```bash
# Check all agent invariants before operation
npm run verify

# Specific invariant checks
npm run policy                    # INV-A03, INV-A06
npm run deps:check               # Architecture constraints
npm run typecheck                # Type safety
npm run test                     # Test integrity
npm run security                 # Vulnerability scanning

# Foundation checks (run first)
test -f .gitattributes           # INV-F01
npm run verify:crlf              # INV-F02, INV-F03
```

---

## Invariant Index

| ID      | Title                            | Severity | Category  |
| ------- | -------------------------------- | -------- | --------- |
| INV-A01 | No Compliance Declaration        | ABSOLUTE | Authority |
| INV-A02 | No Standards Redefinition        | ABSOLUTE | Authority |
| INV-A03 | No Environment File Access       | ABSOLUTE | Safety    |
| INV-A04 | No Direct Main Branch Operations | ABSOLUTE | Safety    |
| INV-A05 | No Test Circumvention            | ABSOLUTE | Safety    |
| INV-A06 | No Failure Silencing             | ABSOLUTE | Safety    |
| INV-E01 | Verification Before Remediation  | ENFORCED | Process   |
| INV-E02 | Deterministic Operations         | ENFORCED | Process   |
| INV-E03 | Bounded Execution                | ENFORCED | Process   |
| INV-E04 | Complete Audit Trail             | ENFORCED | Audit     |
| INV-E05 | Hook/CI Parity                   | ENFORCED | Parity    |
| INV-R01 | Verification Authority           | REQUIRED | Authority |
| INV-R02 | Finding-Based Remediation        | REQUIRED | Process   |
| INV-R03 | Human Gate Compliance            | REQUIRED | Process   |
| INV-R04 | Scope Containment                | REQUIRED | Scope     |
| INV-R05 | Rollback Capability              | REQUIRED | Safety    |

---

## Amendment

These invariants are **immutable**. They may be:

- **Clarified** — Additional explanation without changing meaning
- **Extended** — New invariants may be added
- **Strengthened** — Constraints may be tightened

They may NOT be:

- **Weakened** — Constraints may not be relaxed
- **Removed** — Invariants may not be deleted
- **Overridden** — No exception mechanism exists

---

_These invariants are law. Agents operate within these boundaries or they do not operate._
