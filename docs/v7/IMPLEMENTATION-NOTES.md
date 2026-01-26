Here’s a **clean, tack-on friendly set of “implementation tips / clarifications”** you can append to the existing docs **without reopening the plan**. It’s intentionally short, directive, and non-normative.

You can paste this as **`docs/IMPLEMENTATION-NOTES.md`** or as a final section in the plan.

---

## **Implementation Clarifications & Guardrails (v7)**

The following clarifications are **additive** and exist to prevent ambiguity or long-term drift. They do not change the plan's intent.

---

### 1. `any` Usage — Explicit Boundary Definition

The prohibition on `any` is strict.

**Allowed usage is limited to explicit integration boundaries only**, such as:

- Third-party library adapters with incomplete or unsafe typings
- Legacy system interfaces pending migration
- Runtime deserialization edges (e.g., untrusted JSON input)

**Requirements for any allowed usage:**

- Must be localized to a single boundary layer
- Must include a justification comment in the form:

  ```
  // ANY_OK: <reason> (<ticket-or-link>)
  ```

- Must be enforced by linting or policy checks

Undocumented or scattered `any` usage is a hard failure.

---

### 2. `/docs` vs `/templates` — Authority Boundary

- `/docs` contains **governing contracts** and is immutable by design
- `/templates` contains **reference implementations** only

Rules:

- Governance documents MUST live in `/docs`
- Governance documents MUST NOT be duplicated, copied, or modified in `/templates`
- Templates implement contracts; they do not redefine them

CI or policy checks MAY enforce this separation.

🔵 pr_agent: AI agent governance section could benefit from more specific technical enforcement mechanisms
Rule: pr_agent/docs
💡 Suggestion: Add examples of specific tooling or hooks that enforce these restrictions

---

### 3. Forward-Compatible Commands — Drift Prevention

New commands MAY be added, but only if they:

- Are deterministic
- Do not modify existing command semantics
- Do not overlap or alias existing commands
- Do not bypass `verify` or its guarantees

Existing commands are contractually frozen.

---

### 4. Escape Hatches — Enforcement Required

All escape hatches (e.g., rule suppressions, `any` boundaries) MUST be:

- Rare
- Commented
- Justified
- Mechanically enforced

Documentation alone is insufficient.
Tooling (lint rules or policy scripts) is required.

---

### 5. AI Agent Violations — Required Remediation

When an AI agent violates an invariant:

1. Execution MUST halt immediately
2. CI MUST fail
3. The violation MUST be surfaced to a human
4. No automatic retries are permitted without approval

AI agents are treated as **untrusted automation**, not collaborators.

---

### 6. Renovate & Automation Safety (Implementation Guidance)

Automated dependency updates are acceptable **only when gated by `verify`**.

Teams MAY:

- Limit automerge scope
- Require successful CI prior to merge
- Disable automerge temporarily during high-risk periods

Automation must never bypass quality gates.

---

### 7. Tooling Examples Are Non-Normative

Tooling examples (ESLint, Renovate, Vitest, etc.) illustrate intent only.

- Outcomes are normative
- Tool choices are replaceable
- Enforcement is mandatory

---

### Final Reminder

> **This plan defines what must be true.
> The implementation plan defines how to get there.
> Enforcement defines whether it counts.**
