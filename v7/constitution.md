## **Canonical Contract for `@oddessentials/repo-standards` (v7)**

**Status:** _Proposed_
**Release Type:** **MAJOR / BREAKING CHANGE**
**Audience:** Autonomous engineering teams, AI agents, platform owners
**Intent:** This document is the **constitution**, not a tutorial.

---

### **Purpose**

Plan 7 defines a **minimal, enforceable contract** for repository quality standards.
Everything in this plan exists to ensure that downstream repositories are:

- Deterministic
- Enforceable by automation (not trust)
- Safe for autonomous agents
- Scalable across stacks and teams
- Resistant to entropy over time

Plan 7 intentionally **compresses** prior plans.
If a rule is not enforceable, it does not belong here.

---

## **The Core Contract (Non-Negotiable)**

A repository is **v7-compliant** _if and only if_:

1. It exposes a **canonical command surface**
2. It passes `npm run verify` locally **and** in CI
3. It enforces strict typing and zero new warnings
4. It blocks unsafe AI behavior by policy, not convention
5. It enforces governance through branch protections + CI
6. It behaves identically across operating systems

Everything else is implementation detail.

---

## **Canonical Interface**

### **Single Source of Truth**

There is exactly **one required entrypoint**:

```
npm run verify
```

- `verify` is the **contract**
- Hooks, CI, scripts, and tooling MUST converge on it
- If `verify` passes locally, it must pass in CI
- If CI fails, local execution must reproduce the failure

No repo-specific reinterpretations are allowed.

---

## **Required Script Semantics**

Every compliant repo MUST implement these scripts with **identical meaning**:

| Script     | Semantic Meaning                   |
| ---------- | ---------------------------------- |
| `format`   | Write formatting changes           |
| `check`    | Static checks (no writes)          |
| `test`     | Execute test suite                 |
| `security` | Security & supply-chain checks     |
| `policy`   | Governance & invariant enforcement |
| `verify`   | `check + test + security + policy` |

Names and intent are fixed.
Tooling behind them may evolve.

---

## **Typing & Warnings Policy**

### **Typing**

- Strict typing is mandatory
- `any` is forbidden except at explicitly documented boundaries
- Escape hatches MUST be:
  - Rare
  - Commented
  - Justified

### **Warnings**

- **Zero tolerance** for new warnings
- Lint warnings = failures
- Type warnings = failures
- Security findings = failures

No “we’ll clean it up later” paths exist in v7.

---

## **Hook & CI Parity**

### **Local**

- Pre-commit: fast, staged, deterministic
- Pre-push: MUST execute `verify` (or an equivalent superset)

### **CI**

- CI MUST execute `verify`
- CI MUST NOT auto-fix code
- CI failures MUST be reproducible locally

If hooks and CI diverge, the repo is non-compliant.

---

## **Security & Architecture**

### **Security**

- Automated dependency scanning is required
- Automated static analysis is required
- High-severity findings block merges

### **Architecture**

- Circular dependencies are forbidden
- Production code may not import dev/test dependencies
- Architectural violations are enforced mechanically

---

## **AI Agent Safety (First-Class Concern)**

AI agents are treated as **untrusted automation**.

### **Absolute Prohibitions**

AI agents MUST NEVER:

1. Read, write, or modify `.env*` files
2. Commit or push directly to `main`
3. Skip, delete, or disable tests
4. Silence failures without human approval

### **Enforcement**

These rules MUST be enforced by:

- Hooks
- CI
- Policy scripts

Documentation alone is insufficient.

---

## **Governance**

### **Branching**

- `main` is protected
- All changes go through PRs
- Required status checks include `verify`

### **Releases**

- Semantic versioning is mandatory
- Changelogs are generated automatically
- Humans do not hand-edit versions

---

## **Cross-Platform Determinism**

- Line endings are enforced by policy
- Formatting is deterministic across OSes
- CI is the final arbiter of correctness

Windows, macOS, and Linux must behave identically.

---

## **What Plan 7 Explicitly Does _Not_ Do**

- It does NOT mandate specific tools (only outcomes)
- It does NOT preserve backward compatibility
- It does NOT allow partial compliance
- It does NOT optimize for speed over correctness
- It does NOT trust humans or agents without enforcement

---

## **Compliance Model**

A repository is either:

- ✅ **v7-Compliant**
- ❌ **Non-Compliant**

There are no intermediate states.

---

## **Implementation Guidance (Non-Normative)**

- Prior Plans 1–6 provide reference implementations
- Tooling choices (ESLint, Semgrep, Vitest, etc.) are replaceable
- Enforcement logic is mandatory; implementation is flexible

---

## **Adoption Intent**

Plan 7 is designed to be:

- Copyable
- Enforceable
- Auditable
- Future-proof

Once adopted, **entropy is no longer optional**.
