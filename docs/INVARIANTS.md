# **INVARIANTS.md**

## Repository Invariants — v7

This document defines **non-negotiable invariants** for any repository claiming compliance with `@oddessentials/repo-standards` v7.

If any invariant is violated, the repository is **non-compliant**.

---

## 1. Verification Invariant

**Invariant:**
The repository MUST expose and pass the following command:

```bash
npm run verify
```

- `verify` MUST run locally and in CI with identical semantics
- If `verify` fails in CI, the failure MUST be reproducible locally
- No CI job may bypass or partially replace `verify`

---

## 2. Command Integrity Invariant

The following commands MUST exist and MUST retain their semantic meaning:

| Command    | Meaning                              |
| ---------- | ------------------------------------ |
| `format`   | Write formatting changes             |
| `check`    | Static analysis only (no writes)     |
| `test`     | Execute the test suite               |
| `security` | Security and supply-chain checks     |
| `policy`   | Governance and invariant enforcement |
| `verify`   | `check + test + security + policy`   |

Tooling MAY change. Semantics MAY NOT.

---

## 3. Typing Invariant

- Strict typing MUST be enabled
- `any` is forbidden except at explicitly documented integration boundaries
- All escape hatches MUST be:
  - Minimal
  - Commented
  - Justified

Undocumented `any` usage is a hard failure.

---

## 4. Zero-Tolerance Invariant

- New lint warnings are failures
- New type warnings are failures
- New security findings are failures

There is no warning budget in v7.

---

## 5. Hook / CI Parity Invariant

- Pre-push hooks MUST execute `verify` or a strict superset
- CI MUST execute `verify`
- CI MUST NOT mutate code

If hooks and CI diverge, the repository is non-compliant.

---

## 6. Security Invariant

- Automated dependency scanning is mandatory
- Automated static analysis is mandatory
- High-severity findings block merges

Manual security review does not replace automation.

---

## 7. Architecture Invariant

- Circular dependencies are forbidden
- Production code MUST NOT import dev or test dependencies
- Violations are enforced mechanically, not by convention

---

## 8. AI Agent Safety Invariant

AI agents are untrusted automation.

AI agents MUST NEVER:

1. Read, write, or modify `.env*` files
2. Commit or push directly to `main`
3. Skip, delete, or disable tests
4. Silence failures without human approval

These rules MUST be enforced by hooks and CI.

---

## 9. Governance Invariant

- `main` MUST be protected
- All changes MUST flow through PRs
- Required status checks MUST include `verify`

---

## 10. Cross-Platform Determinism Invariant

- Line endings are enforced
- Formatting is deterministic
- Windows, macOS, and Linux MUST behave identically

---

**Compliance Status:**
A repository is either **v7-compliant** or **non-compliant**.
No partial compliance exists.
