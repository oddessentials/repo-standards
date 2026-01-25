# **GOVERNANCE.md**

## Governance & Enforcement — v7

This document defines **how authority is exercised** in a v7-compliant repository.

---

## Branch Governance

### `main` Branch

- MUST be protected
- MUST disallow direct pushes
- MUST require PRs

### Required Status Checks

- `verify` is mandatory
- No merge is permitted if `verify` fails

---

## Pull Request Rules

- All changes MUST go through PRs
- CI MUST complete successfully
- Human approval is required where configured

---

## Release Governance

- Semantic versioning is mandatory
- Versions and changelogs are generated automatically
- Humans MUST NOT manually version or publish releases

---

## AI Agent Governance

AI agents operate under **strict containment**.

### AI agents:

- Work ONLY on feature branches
- Are subject to the same CI and hooks as humans
- Are blocked from violating invariants by policy scripts

### Violations:

- Are treated as **system failures**
- MUST halt execution immediately
- MUST be escalated to a human

---

## Test Integrity

- Tests are mandatory
- Skipping or deleting tests is prohibited
- All failures require root-cause analysis

---

## Authority Model

| Actor     | Authority                    |
| --------- | ---------------------------- |
| CI        | Final arbiter of correctness |
| Hooks     | Local enforcement            |
| Humans    | Approval & intent            |
| AI agents | Execution only               |

Trust is never implicit.
