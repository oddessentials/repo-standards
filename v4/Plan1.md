# Repo Standards v7 Implementation Plan

## Objective

Deliver a forward-looking, enterprise-grade standards package that downstream repositories can adopt with zero ambiguity. The v7 release prioritizes strict typing, automated quality enforcement, security posture, dependency hygiene, consistent command conventions, and deterministic hooks/CI parity. Backwards compatibility is intentionally not required; the release should be a major version bump with a `BREAKING CHANGE:` commit message and associated semantic-release rules.

## Guiding Principles

1. **Zero-tolerance gates for new repos**: lint, type, security, and formatting failures should hard-fail from day one.
2. **Soft-fail legacy, hard-fail new**: existing issues can be warned, but new violations must fail in both hooks and CI.
3. **Hook/CI parity**: pre-push must run the same verification entrypoint as CI.
4. **Security is default**: vulnerability, dependency drift, and static security analysis are required.
5. **No manual steps**: automation should handle formatting, linting, and changelog generation.
6. **Professional-grade agent behavior**: AI guidance must explicitly avoid unsafe actions (.env changes, main-branch commits, or skipping tests).

## Current State Snapshot (High-Level)

- Standards schema is at v6 with strong coverage, linting, and CI policies.
- Husky and commitlint are present, but push hooks and some enterprise policies are not specified in the standards catalog.
- README describes core philosophy but lacks contributor-grade operational guidance (line endings, toolchain pinning, pre-push testing).

## v7 Scope Additions

### 1. Governance & Agent Safety (NEW Core Requirements)

**Add/extend checklist items in `config/standards.json`:**

- **agent-safety-invariants** (core):
  - Invariant: AI never modifies `.env*` files.
  - Invariant: AI never commits or pushes to `main`.
  - Invariant: AI never skips tests without explicit, documented rationale.
- **professional-grade-execution** (core):
  - Require agent guidance to emphasize enterprise-grade quality, root-cause fixes, and no “shortcut” resolutions.

**Artifacts:**

- Update `templates/INVARIANTS.md` with `.env` and branch safety checks.
- Extend `instructions*.md` output to include a required agent prompt section.

### 2. Dependency & Security Hardening (Core + Recommended)

**Requirements:**

- **Dependency hygiene**: enforce latest dependencies on a weekly cadence via Renovate or Dependabot.
- **Security scans**:
  - `npm audit --audit-level=high` in CI and pre-push.
  - Semgrep required in CI and pre-push (core for new repos).
- **Lockfile enforcement**: strict lockfile integrity with `npm ci` and diff checks.

**Implementation Tasks:**

- Update schema to include a “security-static-analysis” checklist item.
- Add semgrep example tooling + workflow templates in stack hints.

### 3. Strict Typing & Zero-Tolerance Warnings (Core)

**Requirements:**

- TypeScript: `strict: true`, `noImplicitAny`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`.
- `any` usage must be justified with explicit inline comments and lint rules preventing untyped `any` usage.
- Treat type warnings as errors for new repositories; legacy repos may use warning-only mode until refactoring completes.

**Implementation Tasks:**

- Update TypeScript stack hints for stricter `tsconfig` defaults and eslint rules.
- Add new checklist item: **strict-typing-enforcement**.

### 4. Commit Linting + Semantic Release (Core)

**Requirements:**

- Conventional Commits via commitlint in commit-msg hooks.
- semantic-release must generate/update changelog automatically.
- Version guard: block manual version changes outside release flow.

**Implementation Tasks:**

- Add a core checklist item for `semantic-release-changelog`.
- Add release workflow guidance to run `scripts/sync-schema-version-pretest.cjs` to keep schema aligned.

### 5. Hook Automation & Consistent Commands (Core)

**Requirements:**

- **pre-commit**: format + lint on staged files via lint-staged.
- **pre-push**: run `npm run verify` (format check + lint + typecheck + tests + build).
- Provide canonical commands in all examples:
  - `npm run format`
  - `npm run format:check`
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
  - `npm run verify`

**Implementation Tasks:**

- Expand standards checklist with a new requirement: `hook-ci-parity`.
- Ensure push hooks are referenced in instructions and examples.

### 6. CI Quality Gates (Core)

**Requirements:**

- CI must run all quality checks and block merges to `main` without passing status.
- YAML linting is mandatory.
- Dependecy-cruiser (or stack-appropriate tool) required to prevent circular dependencies.
- Code complexity analysis is required and enforced at least as warning thresholds.

**Implementation Tasks:**

- Add `yaml-lint` and `dependency-architecture` to core items.
- Add complexity analysis and circular dependency checks to recommended/core as appropriate.

### 7. Cross-Platform Line Endings (Core)

**Requirements:**

- `.gitattributes` is required and enforced.
- CI must detect CRLF in executable/script files and fail early.

**Implementation Tasks:**

- Update standards checklist notes to emphasize `.gitattributes` and CRLF checks.
- Provide sample `.gitattributes` templates per stack.

### 8. README + Documentation Upgrade (Core)

**Requirements:**

- README must include:
  - Toolchain pinning with `nvm` or Versionfox.
  - Python availability on PATH (for scripts).
  - Hook behavior (pre-commit formatting, pre-push tests).
  - Line ending guidance.
  - Badges for CI, release, commitlint, and formatting that are auto-updated by CI.

**Implementation Tasks:**

- Update README template and generated instructions to reflect new expectations.
- Add/confirm badges that do not require paid services (GitHub Actions + Shields.io).

## Implementation Phases

### Phase 0 — Design & Alignment

- Confirm v7 scope and major version bump policy.
- Agree on strictness defaults for new repos vs legacy repos.
- Finalize canonical command names.

### Phase 1 — Standards Schema + Templates

- Update `config/standards.json` schema version to 7.
- Add new checklist items for:
  - `agent-safety-invariants`
  - `strict-typing-enforcement`
  - `security-static-analysis`
  - `dependency-architecture-rules`
  - `yaml-lint`
  - `hook-ci-parity`
  - `semantic-release-changelog`
  - `complexity-analysis`
- Extend `templates/INVARIANTS.md` with `.env` and branch safety invariants.

### Phase 2 — Generator Updates & Regenerated Artifacts

- Update generator scripts to ensure new fields render in instructions and stack outputs.
- Re-run:
  - `npm run generate:standards`
  - `npx tsx scripts/generate-instructions.ts ...` (for each published config)

### Phase 3 — Documentation & Examples

- Revise README for enterprise-grade contributor guidance.
- Ensure `AGENT-SAFETY.md` and templates match new invariants.
- Add explicit guidance on strict typing and lint warning policy for new repos.

### Phase 4 — Hooks + CI Parity

- Ensure Husky pre-commit and pre-push hooks map to `npm run verify`.
- Validate local + CI parity (mirror commands and fail conditions).

### Phase 5 — Security & Dependency Automation

- Add/validate weekly Renovate configuration.
- Add semgrep and npm audit to CI and pre-push instructions.
- Ensure dependency-cruiser guidance is part of the standard checklist.

### Phase 6 — Release & Versioning

- Update semantic-release guidance to mandate changelog updates.
- Ensure schema version sync step is part of release automation.
- Land `BREAKING CHANGE:` commit for v7.

## Success Criteria

- v7 standards schema published with new enforcement items.
- Instructions and templates explicitly include agent safety and no-.env rules.
- CI + pre-push parity established and documented.
- README reflects enterprise-grade guidance and auto-updating badges.
- Downstream consumers have a clear, deterministic path to adopt without manual steps.

## Risks & Mitigations

| Risk                                 | Impact             | Mitigation                                                                        |
| ------------------------------------ | ------------------ | --------------------------------------------------------------------------------- |
| Increased CI time from strict checks | Slower feedback    | Allow “warning-only” mode for legacy code with diff-based enforcement.            |
| Semgrep false positives              | Noise in CI        | Provide stack-specific baseline rules and explicit allow-lists.                   |
| Strict typing churn                  | Migration pain     | Offer a phased strictness checklist with clear milestones.                        |
| Hook fatigue for large repos         | Developer friction | Provide opt-out via `HUSKY=0` for CI and documented escape hatch for emergencies. |

## Release Plan

1. Complete Phases 1–5 in feature branch.
2. Run full verify suite in CI and local (or emulate in local if CI unavailable).
3. Commit with `BREAKING CHANGE: v7 standards overhaul`.
4. Run semantic-release for v7 publish.
