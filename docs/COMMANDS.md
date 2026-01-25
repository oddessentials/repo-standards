# **COMMANDS.md**

## Canonical Command Contract — v7

This document defines the **only supported command interface** for v7 compliance.

---

## Required Commands

Every compliant repository MUST expose the following commands:

### `npm run format`

- Writes formatting changes
- May modify files
- MUST be deterministic

---

### `npm run check`

- Performs static checks only
- MUST NOT modify files
- Includes linting and type checking

---

### `npm run test`

- Executes the test suite
- MUST fail on test failures
- MUST NOT skip tests silently

---

### `npm run security`

- Executes security and supply-chain checks
- Includes dependency scanning and static analysis
- MUST fail on high-severity findings

---

### `npm run policy`

- Enforces governance and invariants
- Includes (but is not limited to):
  - `.env*` guards
  - branch safety checks
  - architecture constraints

---

### `npm run verify` (**MANDATORY ENTRYPOINT**)

```text
verify = check + test + security + policy
```

- `verify` is the **only required contract**
- Hooks and CI MUST converge on this command
- If `verify` passes locally, it MUST pass in CI

---

## Prohibited Patterns

- Repo-specific reinterpretation of command semantics
- CI pipelines that bypass `verify`
- “Fast paths” that skip policy or security checks

---

## Forward Compatibility

New commands MAY be added.
Existing commands MAY NOT change meaning.
