# Meta-Principles for Quality-Gate Patterns

Meta-principles are cross-cutting design rules that apply across _many_ individual patterns in this catalog. They capture the hard-won constraints that distinguish a pattern that _looks like_ enforcement from one that _actually enforces reliably_.

These are not checklist items — they are standards for how patterns are written, tested, and delivered. Pattern authors and template maintainers should treat violations as bugs. Every pattern template under `templates/patterns/<id>/README.md` ends with a footer listing which of these principles the template obeys (see [Pattern-template footer convention](#pattern-template-footer-convention) at the end of this document).

## Table of contents

- [`mp-adversarial-proof-required`](#mp-adversarial-proof-required) — invariants must prove they catch regressions
- [`mp-churn-bait-discipline`](#mp-churn-bait-discipline) — lock identifiers, never prose
- [`mp-committed-proof-artifacts`](#mp-committed-proof-artifacts) — material claims ship as diffable manifests
- [`mp-defense-in-depth`](#mp-defense-in-depth) — pair shift-left gates with runtime gates
- [`mp-point-in-time-structural-claims`](#mp-point-in-time-structural-claims) — structural claims are verified-at-commit, not eternal
- [`mp-authoritative-contract-file`](#mp-authoritative-contract-file) — one source of truth per shared number
- [`mp-enforce-helpers-over-primitives`](#mp-enforce-helpers-over-primitives) — block the primitive, not just the mistake
- [`mp-allowlist-over-blocklist`](#mp-allowlist-over-blocklist) — security surfaces default to closed

---

## `mp-adversarial-proof-required`

**Any invariant-asserting test MUST ship with adversarial negative tests proving it catches the regression case. Without proof-of-catch, "enforcement" is unverified.**

### Why

A test that _looks like_ it enforces something but has no adversarial test is indistinguishable from a test that passes trivially. Reviewers cannot tell whether the assertion actually bites. Experience shows that such tests drift silently over time — broadened assertions, try/except swallowing, permissive matchers — and nobody notices until the defect class returns in production.

### How to apply

For every check that asserts an invariant (parity test, ratchet gate, rule-disable guardrail, schema conformance test), ship at least two additional tests alongside the check itself:

1. **Fabricated-regression test** — deliberately construct the exact regression the check is supposed to catch and verify the check fails.
2. **Removed-correctness test** — remove or weaken the condition the check relies on and verify the check fails.

Both should live in the same test file as the check and reference it by name so the linkage is obvious.

### Patterns governed

- `lcp-parity-doc-coverage-test` — must prove it catches both a "fabricated new gate without doc cite" and a "removed cite for an existing gate"
- Every `p-*` persistence parity test
- Every `sec-rule-disable-*` guardrail
- Every `td-*` ratchet gate

---

## `mp-churn-bait-discipline`

**Parity and drift tests lock _canonical identifiers_ only — never prose, row counts, link shapes, or wording. Extending beyond canonical identifiers turns tests into churn-bait; consumers will remove them.**

### Why

Parity tests survive only if their lock surface is both _load-bearing_ (catches real defects) and _stable under editorial churn_ (doesn't fail on wording tweaks, reorg, or link updates). Prose-locking tests fail both criteria: wording shifts constantly, so the test fires on every minor doc edit, training reviewers to bypass it. Once the bypass habit forms, the test provides no signal and gets removed. Identifier presence, by contrast, shifts only when code structure actually changes — making it a high-signal, low-noise lock.

### How to apply

When writing a parity test between a code surface and a doc surface:

- **Lock:** canonical identifier presence — function name, command name, gate name, or rule ID appears somewhere in the doc.
- **Do NOT lock:** surrounding prose, adjacent rows, link text, formatting, section ordering, wording style, or bullet counts.

Every pattern template that ships a parity test must carry this constraint verbatim in its README. Consumers need to see the discipline, not just inherit it silently — otherwise the next person who extends the test will reach past the intended scope.

### Patterns governed

- `lcp-parity-doc-coverage-test`
- Any future test that asserts equivalence between a code inventory and a doc inventory

---

## `mp-committed-proof-artifacts`

**Any claim that is hard to verify by code inspection alone — disabled-rule safety, subprocess-allowlist coverage, fundamental-table membership, rule-disable compensating controls — should be backed by a committed JSON manifest that is diffable in PR and exact-match-checked on every run.**

### Why

Some claims can't be checked with a single grep or a simple AST walk: "every call site of X is covered by a compensating control," "every disabled rule still has a valid justification." Without a materialized manifest, the claim lives only in reviewer memory — it drifts silently as new call sites appear.

A committed proof artifact makes the claim _concrete_, _diffable in PR_, and _machine-checkable on every run_. New call sites fail the exact-match check and force the author to either update the manifest (with justification) or change the code.

### How to apply

- Ship a `.<claim>-audit.json` (or similar) at repo root.
- Include enough context per entry for review: file path, line, kind of use, why it's acceptable.
- CI verifies the manifest matches reality _exactly_ — neither a superset nor a subset. Additions require explicit manifest updates; removals require removing the entry.
- Generator + verifier live in the repo as committed scripts, not in external tooling.

### Patterns governed

- `sec-rule-disable-proof-artifact`
- `sec-subprocess-allowlist`
- `td-test-floor-contract` (same pattern applied to test-count commitments)

---

## `mp-defense-in-depth`

**Where feasible, pair a shift-left gate (PR-time parity test) with a runtime gate (connect-time / request-time check). They catch the same defect class at different costs and compensate for each other's blind spots.**

### Why

Shift-left gates (parity tests, ratchet checks) catch defects in PR CI. That's the cheapest fix point. But they depend on the test suite actually running correctly — if a harness change disables them silently, the gate stops firing. A runtime check catches the same defect class when real code paths exercise it, guaranteeing detection even when the PR-time gate was bypassed.

Neither gate alone is sufficient: shift-left may miss an accidentally-disabled test; runtime may only fire once the bad state reaches production. Together they cover each other's failure modes.

### How to apply

For any defect class with both a shift-left opportunity and a runtime opportunity, ship both:

- **Shift-left:** static or test-time check on the PR.
- **Runtime:** an assertion or validation at the relevant boundary (DB connect, HTTP request entry, module import).

Design the runtime check to fail loud — exit code, exception, or alert — not to silently recover and continue in a degraded state.

### Patterns governed

- `p-schema-migration-parity` (shift-left) paired with `p-required-tables-runtime-check` (runtime)
- Any future pattern where both gates are available

---

## `mp-point-in-time-structural-claims`

**Any structural claim in a pattern doc — counts, file lists, identifier inventories — is _verified at the time of writing_, not an eternal guarantee. Pattern docs state this explicitly and instruct implementers to re-verify before acting.**

### Why

Pattern docs accumulate specifics over time: "there are 38 gates in the preflight runner," "the parity doc has 82 rows." These numbers help readers calibrate but are _snapshots_. Branches advance; scripts get refactored. If a pattern doc reads as authoritative-forever and an implementer acts on a stale count, the resulting work is wrong.

### How to apply

- When a pattern doc states a structural count or inventory, stamp it: include the commit SHA (or date) at which it was verified.
- Include an explicit instruction to re-verify: "re-run the AST walk against HEAD before writing any code."
- Prefer describing _the shape of what you'll find_ over _the specific numbers you'll find_: "iterate every `CommandSpec` call site" is more durable than "there are 38 `CommandSpec` calls."

### Patterns governed

- Every pattern README (forthcoming under `templates/patterns/<id>/`)
- Any future pattern doc that makes a structural claim

---

## `mp-authoritative-contract-file`

**Where a number or invariant is shared across multiple sites — CI workflow, local preflight, ratchet gate — store it in a single contract JSON with an `authority` field pointing at the canonical producer. No hardcoded integers duplicated across files.**

### Why

Magic numbers duplicated across three files drift. CI reads one, local preflight reads another, the ratchet gate reads a third — and over time they disagree. The disagreement shows up as "CI passes but local fails" or "local passes but CI fails," both of which erode trust in the entire verification system.

A single contract JSON with a documented authority ends the drift: every consumer reads from the same file, and the file names its canonical producer so anyone who wants to change the number knows who's responsible.

### How to apply

- Store the shared value in a JSON file at repo root (e.g., `.test-floor-contract.json`).
- Include an `authority` field pointing at the producer code (e.g., `"authority": "scripts.check_ratchet_bump.collect_snapshot"`).
- Every consumer reads from this file — no inline constants.
- The producer writes to this file — nowhere else does.
- CI verifies the file was actually regenerated (staleness check) when the producer's inputs changed.

### Patterns governed

- `td-test-floor-contract`
- `td-coverage-ratchet` (via the floor formula)
- Any future pattern sharing a threshold across multiple call sites

---

## `mp-enforce-helpers-over-primitives`

**When a helper exists to make an operation safe, CI must forbid direct use of the underlying primitive. The helper's existence alone is not enough — the primitive must be blocked.**

### Why

A helper makes it _easy_ to do the safe thing; blocking the primitive makes it _impossible_ to accidentally do the unsafe thing. "We have a helper" plus "direct use of the primitive is still legal" degrades into "most of the codebase uses the helper but a few places forgot." Those forgotten places are where the vulnerability lives.

### How to apply

- When introducing a helper (e.g., a pagination-token wrapper, a crypto wrapper, a subprocess wrapper), pair it with a CI gate that forbids direct use of the underlying primitive.
- Grep or AST-check for the primitive; allowlist only the helper's internal implementation.
- Keep the helper opinionated — it should be obvious when a caller reaches around it.

### Patterns governed

- `sec-helper-enforcement`
- Any future pattern that wraps a dangerous primitive

---

## `mp-allowlist-over-blocklist`

**For security-sensitive surfaces — subprocess commands, CI-runnable actions, dependency sources — enumerate known-good and deny the rest. Blocklists of known-bad are unbounded and cannot be complete.**

### Why

Blocklists encode what you already know is dangerous. The gap — things that are dangerous and you don't know yet — is where attacks live. Allowlists flip the burden: new actions require an explicit review, catching both novel attacks and legitimate expansions.

### How to apply

- Identify the security surface (subprocess commands, GitHub Actions, npm registry sources, etc.).
- Enumerate known-good entries in a committed allowlist file.
- CI gate rejects any entry not in the allowlist.
- Keep the allowlist compact; make additions visible in PR review.

### Patterns governed

- `sec-subprocess-allowlist`
- Any future pattern gating a security-sensitive surface

---

## Pattern-template footer convention

Every template under `templates/patterns/<id>/README.md` ends with a standard footer of the form:

```markdown
## Design principles this template obeys

This pattern follows: `mp-adversarial-proof-required`, `mp-churn-bait-discipline`, `mp-committed-proof-artifacts` — see [Meta-Principles](../../patterns/meta-principles.md) for context.
```

A P2 CI gate verifies this footer exists in every pattern-template README. Missing footers fail the gate so meta-principles can't rot into ignored prose as the template count grows.
