# Odd Essentials Repository Standards Constitution

> **Version:** 1.0.0
> **Status:** Canonical
> **Scope:** All v7-compliant repositories within the Odd Essentials ecosystem

---

## Preamble

This constitution establishes the governing principles, invariants, and enforcement mechanisms for all repositories operating under the Odd Essentials standards framework. It synthesizes all authoritative governance documents into a single, normative reference.

**Foundational Principle:**

> **Standards are law. Orchestration is procedure. AI is a tool — never a judge.**

This principle is enforced mechanically. Social contracts, conventions, or trust are insufficient.

---

## Part I: Authority Model

### 1.1 Separation of Concerns

| Entity                    | Authority Domain          | Boundary                                                  |
| ------------------------- | ------------------------- | --------------------------------------------------------- |
| `repo-standards`          | **Compliance truth**      | Defines what compliance means; never executes workflows   |
| `odd-standards-conductor` | **Execution order**       | Orchestrates lifecycle; never redefines compliance        |
| `odd-issue-manager`       | **Signal discovery**      | Normalizes external feedback; never decides compliance    |
| CI                        | **Execution environment** | Executes verification; never defines compliance semantics |
| Hooks                     | **Local enforcement**     | Prevents violations before commit/push                    |
| Humans                    | **Approval & intent**     | Provide authorization and resolve ambiguity               |
| AI Agents                 | **Execution only**        | Propose changes; never declare success                    |

### 1.2 Trust Model

**Trust is never implicit.** All actors are subject to mechanical enforcement:

- Standards changes flow downstream only
- Same inputs MUST produce same outputs (determinism)
- Agents may propose changes but NEVER declare compliance
- `repo-standards verify` is the sole compliance authority

---

## Part II: The Core Contract

A repository is **v7-compliant** if and only if it:

1. Exposes a **canonical command surface** with frozen semantics
2. Passes `npm run verify` locally **and** in CI with identical behavior
3. Enforces **strict typing** with zero tolerance for new warnings
4. Blocks unsafe AI behavior **by policy and tooling**, not convention
5. Enforces governance through **branch protections and CI**
6. Behaves identically across **Windows, macOS, and Linux**

**Compliance is binary.** Partial compliance does not exist.

> **Note:** v7 defines `npm run verify` as the **reference implementation** of the canonical `verify` contract.
> Non-Node ecosystems MUST expose a functionally equivalent entrypoint with identical semantics.

---

## Part III: Canonical Command Interface

### 3.1 Required Commands (Reference Implementation)

| Command            | Requirement   | Semantics (Frozen)                                 |
| ------------------ | ------------- | -------------------------------------------------- |
| `npm run format`   | MUST exist    | Write deterministic, idempotent formatting changes |
| `npm run check`    | MUST exist    | Static checks only; MUST NOT modify files          |
| `npm run test`     | MUST exist    | Execute test suite; MUST fail on test failures     |
| `npm run security` | MUST exist    | Security and supply-chain checks                   |
| `npm run policy`   | MUST exist    | Governance and invariant enforcement               |
| `npm run verify`   | **MANDATORY** | Composite: `check + test + security + policy`      |

### 3.2 Command Integrity

- `verify` is the **only** required compliance contract
- Hooks and CI MUST converge on `verify`
- If `verify` passes locally, it MUST pass in CI
- CI pipelines MUST NOT bypass `verify`
- Tooling may change; **semantics MUST NOT**

### 3.3 Forward Compatibility

New commands MAY be added if they:

- Are deterministic
- Do NOT alter existing semantics
- Do NOT alias or overlap existing commands
- Do NOT bypass `verify`

---

## Part IV: The Ten Invariants

Violation of any invariant renders a repository **non-compliant**.

### Invariant 1: Verification

- MUST expose and pass `verify`
- Identical semantics locally and in CI
- CI failures MUST be reproducible locally

### Invariant 2: Command Semantics

- Command meanings are frozen
- Tooling may change; semantics MUST NOT

### Invariant 3: Strict Typing

- Strict typing is mandatory
- `any` is forbidden except at documented boundaries
- Escape hatches MUST be minimal, justified, and enforced

**Required annotation:**

```ts
// ANY_OK: <reason> (<ticket>)
```

### Invariant 4: Zero Tolerance

- New lint warnings = failure
- New type warnings = failure
- New security findings = failure
- No warning budget in v7

### Invariant 5: Hook / CI Parity

- Pre-commit: fast, staged, deterministic
- Pre-push: MUST execute `verify` (or strict superset)
- CI: MUST execute `verify`
- CI MUST NOT mutate code
- Divergence = non-compliance

### Invariant 6: Security

- Dependency scanning is mandatory
- Static analysis is mandatory
- High-severity findings block merges
- Manual review does NOT replace automation

### Invariant 7: Architecture

- Circular dependencies forbidden
- Production MUST NOT import dev/test deps
- Enforced mechanically

### Invariant 8: AI Agent Safety

AI agents MUST NEVER:

1. Read/write `.env*`
2. Commit or push to `main`
3. Skip or disable tests
4. Silence failures

**Violation Protocol:**

- Execution halts immediately
- CI fails
- Human escalation required
- No automatic retries

### Invariant 9: Governance

- `main` MUST be protected
- Direct pushes forbidden
- PRs required
- `verify` required as a status check

### Invariant 10: Cross-Platform Determinism

- LF line endings only
- Deterministic formatting
- Windows/macOS/Linux identical
- CI is final execution environment

---

## Part V: Governance Procedures

### 5.1 Branch Protection

- PRs required
- `verify` required
- No bypasses

### 5.2 Release Governance

- Semantic versioning mandatory
- Versions/changelogs automated
- Humans MUST NOT version manually
- Breaking changes → major version

### 5.3 Standards Version Pinning

```toml
[standards]
version = "3.0.0"
mode = "pinned"   # or "floating"

[packs]
node = "3.0.0"
github-actions = "3.0.0"
```

Pinned repositories are evaluated **only** against the pinned version unless an explicit upgrade session is initiated.

---

## Part VI: Verification System

### 6.1 VerifyResult Schema

```ts
interface VerifyResult {
  schema_version: "1.1.0";
  produced_at: string;
  repo_id: string;
  standards_version: string;
  pack_ids: string[];
  findings: Finding[];
  is_compliant: boolean;
  requires_human: boolean;
  input_hash: string; // Canonical InputManifest hash
  verifier_version: string;
}
```

### 6.2 Determinism

- Same inputs → identical output
- `input_hash` excludes:
  - Lockfiles (dependency drift is out of scope)
  - Timestamps
  - Environment-specific paths

- Zero network access during verification

### 6.3 Repository Identifier

```
<provider>:<org>/<repo>@<default_branch>
```

Examples:

- `github:oddessentials/repo-standards@main`
- `azuredevops:oddessentials/repo-standards@main`
- `local:<path_hash>@<branch>`

---

## Part VII: Remediation System

### 7.1 Lifecycle

```
Spec → Apply → Verify → Remediate → Verify
```

- No remediation without failing verification
- Every action auditable and replayable
- Bounded loops only

### 7.2 Routing Rules

| Condition                  | Remediator       | Human Gate |
| -------------------------- | ---------------- | ---------- |
| Mechanical                 | Mechanical fixer | No         |
| AI, small scope, low risk  | AI Agent         | No         |
| AI, repo-wide or high risk | AI Agent         | **Yes**    |
| Human class                | None             | **Yes**    |

### 7.3 Stop Conditions

- COMPLIANT
- AWAITING_HUMAN
- NEEDS_HUMAN_STALE
- MAX_ATTEMPTS
- BUDGET_EXCEEDED
- SAFETY_STOP

---

## Part VIII: Human-in-the-Loop

- Approval via PR labels or commands
- Default timeout: 24h (escalation at 12h)
- No response → remediation halts

---

## Part IX: Content Normalization

- LF only
- UTF-8
- One trailing newline
- Comments preserved where semantically meaningful
- Key sorting applies **only to standards-owned files**

---

## Part X: Deployment Modes

| Mode         | Issue Manager | Direct Signals |
| ------------ | ------------- | -------------- |
| Organization | Required      | Prohibited     |
| Team         | Required      | Prohibited     |
| Single Repo  | Optional      | Allowed        |
| Local Dev    | N/A           | Required       |

---

## Part XI: Escape Hatches

Escape hatches MUST be:

- Rare
- Commented
- Justified
- Mechanically enforced

Undocumented escape hatches = hard failure.

---

## Part XII: Non-Goals

This constitution does NOT:

- Allow partial compliance
- Trust AI or humans implicitly
- Permit best-effort enforcement
- Optimize speed over correctness
- Allow agents to override verification

---

## Part XIII: Amendments

- PR required
- 7-day review
- Maintainer approval
- Version bump
- Downstream propagation

---

## Final Statement

**This constitution is law. Compliance is not optional.**
