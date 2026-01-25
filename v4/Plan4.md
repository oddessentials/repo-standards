Below is a **forward-only, major-version (BREAKING CHANGE) implementation plan** to harden `@oddessentials/repo-standards` so downstream repos inherit **consistent commands, strict typing, zero-warning regressions, automated hooks, CI parity, security scanning, dependency freshness, and agent safety invariants**.

What I can see in the current repo state (relevant to this plan): the repo already contains **Husky**, **commitlint**, **eslint flat config**, **tsconfig**, **semantic-release config**, **renovate config**, and **.gitattributes**, plus the master standards spec + generated views. ([GitHub][1])

---

## North Star Invariants (Non-Negotiable)

These become “contract tests” enforced by hooks + CI:

1. **One command surface across all repos**
   - Standard scripts (same names everywhere):
     - `npm run format` (writes)
     - `npm run check` (no-write lint/type)
     - `npm run test`
     - `npm run verify` (CI-grade: check + test + security + policy)

2. **Strict typing is on by default**
   - TS: `strict: true` plus additional strictness flags; ESLint: `@typescript-eslint/no-explicit-any` is **error** (no “any” except approved escape hatches).

3. **Warnings are treated as failures (new repos)**
   - `eslint --max-warnings 0`
   - TypeScript “noEmit” check must fail on any TS error.

4. **Commit discipline is enforced everywhere**
   - commitlint locally (commit-msg hook) **and** in CI (PR-title or commit range).

5. **Semantic-release always produces an updated changelog**
   - Every release updates `CHANGELOG.md` automatically and creates GitHub Release notes.

6. **Hooks match CI**
   - pre-commit: fast, deterministic, staged-file focused (format/lint/types where feasible)
   - pre-push: runs `npm run verify` (or the same subset CI runs)

7. **Cross-platform line endings never regress**
   - `.gitattributes` enforces LF/CRLF rules; CI runs a line-ending check.

8. **Agent safety**
   - **AI must never modify `.env*`** (hard-fail)
   - **AI must never commit/push to `main`** (enforced by branch protection + CI expectations + docs)
   - **AI must never skip tests** without an explicit stop + explanation + human approval step documented.

---

## Phase 0 — Baseline Audit (1 PR, no behavior change yet)

**Goal:** produce an “authoritative current-state report” so every subsequent phase is surgical.

**Work items**

- Add `docs/AUDIT.md` containing:
  - Current scripts inventory + gaps vs North Star
  - Current CI workflows inventory + gaps
  - Current hooks inventory + gaps
  - Current strict typing flags + gaps
  - Current warning counts (eslint/types/security)
  - Current dependency update automation status (renovate config summary)

- Add `docs/INVARIANTS.md` listing the invariants above in hard language (MUST/MUST NOT).

**Definition of done**

- `npm run verify` exists (even if it initially just composes existing commands).
- CI runs `npm run verify`.

---

## Phase 1 — Command Surface Standardization (BREAKING CHANGE)

**Goal:** make this repo the “golden interface” for downstream consumers.

**Work items**

1. Normalize npm scripts (root `package.json`) to this canonical set:
   - `format`: prettier (write)
   - `check:format`: prettier (check)
   - `lint`: eslint
   - `check:types`: `tsc -p tsconfig.json --noEmit`
   - `test`: vitest
   - `check`: `check:format && lint && check:types`
   - `verify`: `check && test && security && policy`
   - `security`: `audit && semgrep`
   - `audit`: `npm audit --audit-level=high` (or “moderate” if you want earlier pressure)
   - `policy`: dependency-cruiser + yaml-lint + env-guard + line-ending guard

2. Enforce “no warnings”:
   - ESLint `--max-warnings 0`

3. Add `docs/COMMANDS.md` with copy/paste guidance for consumers:
   - “Your repo must implement these scripts with identical meaning.”

**Definition of done**

- `npm run verify` is a single entrypoint that CI and pre-push call.
- All script names and semantics are stable and documented.

---

## Phase 2 — Strict Typing + Zero-Any Policy

**Goal:** remove ambiguity and stop “any creep.”

**Work items**

1. Update `tsconfig.json` to be aggressively strict (baseline):
   - `strict: true`
   - `noImplicitAny: true`
   - `noUncheckedIndexedAccess: true`
   - `exactOptionalPropertyTypes: true`
   - `useUnknownInCatchVariables: true`
   - `noPropertyAccessFromIndexSignature: true`

2. ESLint rules:
   - `@typescript-eslint/no-explicit-any: "error"`
   - Require typed boundaries for public APIs (`explicit-module-boundary-types`)

3. Approved escape hatch:
   - Create `docs/ANY_POLICY.md`:
     - “`any` allowed only at a _single integration boundary_ with a comment containing `// ANY_OK: <reason> (ticket/link)`”

   - Add a small lint rule/config pattern that requires the `ANY_OK:` token when disabling the rule.

**Definition of done**

- `npm run check` fails if `any` is introduced without an approved boundary marker.
- Type errors fail locally and in CI.

---

## Phase 3 — Commit Linting + Semantic Release (Changelog Guaranteed)

**Goal:** every merged change is release-ready, and every release updates changelog.

**Work items**

1. Commit linting strategy (recommendation that scales):
   - Local: `commit-msg` hook running commitlint
   - CI: validate **PR title** as Conventional Commits (best with squash merge)

2. Semantic-release config:
   - Ensure plugins include changelog + git + github:
     - `@semantic-release/changelog` updates `CHANGELOG.md`
     - `@semantic-release/git` commits `CHANGELOG.md` (and version bumps if applicable)
     - `@semantic-release/github` publishes GitHub release notes

3. Add `docs/RELEASES.md`:
   - “How to cut releases (it’s automatic)”
   - “What triggers major/minor/patch”
   - Explicit policy: **breaking changes MUST use `BREAKING CHANGE:` footer or `!` syntax**

**Definition of done**

- A release run demonstrably updates `CHANGELOG.md` automatically (no manual edits).
- CI blocks merges if PR title/commit format is invalid.

---

## Phase 4 — Hooks That Match CI (Pre-commit + Pre-push)

**Goal:** “what passes locally passes in CI” without developers manually running commands.

**Work items**

1. Add `lint-staged` for pre-commit:
   - Format staged files
   - ESLint staged files
   - (Optional) `tsc -p ... --noEmit` only if fast enough; otherwise keep TS on pre-push

2. pre-push runs: `npm run verify`
3. Add explicit docs:
   - `docs/LOCAL_WORKFLOW.md`:
     - “pre-commit formats”
     - “pre-push runs verify”
     - “CI runs verify (same command)”

**Definition of done**

- Developers do not need to remember to run format/lint/type/test manually.
- Hooks are deterministic and do not mutate in CI.

---

## Phase 5 — Cross-Platform Line Endings (Never Regress)

**Goal:** eliminate Windows/Linux newline churn permanently.

**Work items**

1. Harden `.gitattributes`:
   - Default `* text=auto eol=lf`
   - Explicit CRLF for `*.bat`, `*.cmd`, maybe `*.ps1` depending on your policy

2. Add `.editorconfig` (if not present) consistent with the `.gitattributes` rules
3. Add `policy:lineendings` script:
   - Detect CRLF in LF-only files in the git index (not working tree)

4. CI runs `policy:lineendings`

**Definition of done**

- PRs cannot introduce newline regressions; hooks/CI catch it.

---

## Phase 6 — Policy Checks: Dependency-Cruiser + YAML Lint + Complexity Gates

**Goal:** shift-left architecture + config hygiene.

**Work items**

1. Add dependency-cruiser config + script:
   - Ban circular deps
   - Ban cross-layer imports (you define layers)
   - Add a “complexity” / “coupling” rule-set that starts as warnings _only if legacy_; **new violations fail**

2. Add YAML lint:
   - `yamllint` (or equivalent) with config targeting `.github/workflows/**/*.yml`, `renovate.json` (json lint separately), etc.
   - Make YAML lint required in `npm run policy`

3. Add basic complexity static analysis:
   - ESLint sonarjs (complexity-like signals)
   - Or `ts-prune`/`madge` style checks if helpful
   - Rule: “new complexity violations fail,” legacy may be baseline’d (but since you said no backward-compat concerns, you can hard fail immediately)

**Definition of done**

- Circular deps are impossible to merge.
- YAML mistakes are impossible to merge.
- Complexity/coupling regressions are blocked.

---

## Phase 7 — Security Scanning on Push + CI

**Goal:** “secure by default” without paid services.

**Work items**

1. `npm audit` on pre-push + CI (already part of `verify`)
2. Semgrep:
   - Add a baseline semgrep config for JS/TS + supply chain patterns
   - Run on pre-push (optional) and CI (required)

3. Add a GitHub Actions workflow job for security:
   - Runs semgrep + npm audit
   - Uploads SARIF if you want GitHub-native code scanning view (still free for public repos)

**Definition of done**

- Security scanning is part of the core `verify` lifecycle and cannot be skipped.

---

## Phase 8 — Agent Safety Enforcement (Hard Fails)

**Goal:** enforce “AI cannot do unsafe things” with code, not trust.

**Work items**

1. **.env guard**
   - Add `policy:envguard` script that fails if any staged/changed file matches:
     - `.env`, `.env.*`, `**/*.env`, `**/secrets*`, etc. (your chosen patterns)

   - Run it in pre-commit and CI.
   - Provide an override mechanism only for humans (example: require `ENV_ALLOWLIST_TOKEN` in commit message AND a manual label in PR—documented)

2. **No direct main commits**
   - Document required branch protection settings in `docs/GOVERNANCE.md`:
     - Require PRs to merge
     - Require status checks: `verify`, `security`, `policy`
     - Require linear history (optional)
     - Require CODEOWNERS approval for `/config`, `/.github`, `/scripts`, `/prompts`

3. Add the required agent prompt verbatim into `docs/AGENTS.md` and reference it from README.

**Definition of done**

- CI/hook hard-fails if `.env*` is touched.
- README makes governance explicit: AI works on branches; humans approve merges.

---

## Phase 9 — README Overhaul + Badges That Stay Accurate

**Goal:** README becomes an enterprise-grade landing page and “trust signal.”

**Work items**

1. Update README sections:
   - “What this repo is / is not” (policy catalog + tooling)
   - “Quick start”
   - “Commands” (the canonical surface)
   - “Governance & Safety” (env + main protections + test skipping policy)
   - “Consumer adoption” (how other repos inherit)

2. Badges (free, auto-maintained):
   - GitHub Actions badges for:
     - `verify`
     - `security`
     - `release`
     - `policy` (dep-cruiser + yaml lint + line endings)

   - Renovate badge (already present in README today) ([GitHub][1])
   - Semantic-release badge (already present) ([GitHub][1])
   - Add **OpenSSF Scorecard** badge (free) by running the Scorecard action weekly and publishing badge

3. Ensure badges cannot drift:
   - Badges point only at workflow names/files in this repo
   - Workflows are versioned and stable

**Definition of done**

- README tells a new consumer exactly how to adopt with minimal ambiguity.
- Badges reflect real enforcement and stay green only when standards are met.

---

# Explicit “Unruly Code / Coverage / Warnings” Handling

Because you said “no backwards compatibility concerns,” the fastest, cleanest enterprise path is:

- **Zero existing warnings policy**: fix them now, then lock in.
- Increase coverage where obvious gaps exist:
  - Add tests for every policy script (env guard, line endings, yaml lint runner, dep-cruiser config expectations).

- CI gating: once clean, enforce “no regression” on:
  - lint warnings (0)
  - type warnings/errors (0)
  - security findings (0 or explicitly triaged baseline with expiry)

If there are areas that are currently messy or under-tested, the team must either:

- Fix them in this same major bump, **or**
- Create a `docs/TODO.md` with a **dated** remediation plan and a “sunset” date for any temporary baselines.

---

## Downstream Consumer Enablement (How projects “inherit” this)

To make this pay dividends across your ecosystem:

1. Add `templates/` as “drop-in starter kits”:
   - `templates/node-typescript/` with:
     - package scripts (canonical)
     - husky + lint-staged
     - eslint + tsconfig strict
     - yaml lint + dep-cruiser config
     - GH Actions workflows that call `npm run verify`

2. Add `docs/CONSUMERS.md`:
   - “Minimum adoption checklist”
   - “Recommended branch protections”
   - “How to enable Renovate weekly”

3. Provide a single “bootstrap” command (optional but powerful):
   - `npx @oddessentials/repo-standards init --stack typescript`
   - Generates/copies templates and wires scripts (ideal, if you want true scale)

---

## Required Agent Prompt (to include verbatim)

Add this exact text to `docs/AGENTS.md` and reference it from README:

> This must be done professionally with enterprise-grade best practices at the forefront. Take your time and do the work correctly. Plan as needed so that we are efficient. Carefully review the /docs, tests, and code to gain a full understanding of this code repository. Then thoroughly verify the code to create an implementation plan for the following items. Commit each phase to current branch after ensuring that all CI and quality checks pass. If you encounter failures they must be fixed in a professional, enterprise-grade fashion whether or not they were pre-existing.

---

## What the autonomous team should deliver (PR slicing)

**PR1:** Phase 0 + Phase 1 (commands + verify wired into CI) — commit message includes `BREAKING CHANGE:`
**PR2:** Strict typing + no-any policy + lint hard-fail
**PR3:** commitlint CI + semantic-release changelog guarantee
**PR4:** hooks parity (pre-commit + pre-push) + docs
**PR5:** line endings + policy scripts + CI enforcement
**PR6:** dependency-cruiser + yaml lint + complexity checks
**PR7:** security (audit + semgrep + SARIF optional)
**PR8:** README overhaul + badges + consumer templates

Each PR must:

- keep `main` green,
- run `npm run verify` locally before push,
- add/extend tests for any new policy tool.

---

[1]: https://github.com/oddessentials/repo-standards "GitHub - oddessentials/repo-standards: A single, authoritative JSON specification for repository quality standards across multiple stacks (TypeScript/JS, C#/.NET, Python, Rust, and Go); plus deterministic tooling."
