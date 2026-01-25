# Implementation Plan for v7: Enhancing repo-standards for Downstream Best Practices

## Overview

This implementation plan outlines a forward-looking enhancement of the `oddessentials/repo-standards` repository to version 7.0.0. The goal is to harden the repository as a premier source of enterprise-grade best practices for downstream consumers across multiple stacks (TypeScript/JS, C#/.NET, Python, Rust, Go). We will address identified gaps, incorporate critical lessons from consumer experiences, and ensure automated, deterministic enforcement of quality standards.

Key principles:

- **Forward-focus**: No backwards compatibility concerns; major version bump via BREAKING CHANGE commit.
- **Enterprise-grade**: Professional, scalable, and automated processes with zero tolerance for regressions post-cleanup.
- **Automation-first**: Maximize hooks, CI, and tools to minimize manual intervention.
- **Phased approach**: Break into discrete phases with commits after passing all quality checks.
- **AI guidelines**: Embed invariants (e.g., no .env touches, no main branch pushes) in documentation.

The plan assumes an autonomous software engineering team working on a feature branch (e.g., `feat/v7-enhancements`). Each phase ends with a commit (using Conventional Commits) after verifying:

- `npm run verify` passes (expands to lint, format:check, typecheck, test, build).
- All CI workflows pass (ci.yml for quality, release.yml for semantic checks if applicable).
- No new warnings (lint, types, security).
- Tests cover root causes; no skips.

Final merge to main triggers semantic-release for v7.0.0.

## Current State Review

Based on thorough analysis of code, docs, tests, and configs:

### Strengths

- **Dependencies**: Managed with Renovate (weekly schedule, automerge for dev patch, vulnerability alerts).
- **Typing**: Strict mode enabled in `tsconfig.json` (`"strict": true`).
- **Commit Linting**: `@commitlint/config-conventional` enforced.
- **Semantic-Release**: Configured with changelog auto-generation; aligned with schema version.
- **Hooks**: Husky with lint-staged (prettier + eslint --fix on staged files); pre-commit formatting/linting.
- **CI**: `npm run ci` runs lint, format:check, typecheck, test (Vitest with V8 coverage), build; GitHub Actions workflows (ci.yml, release.yml) enforce.
- **Line Endings**: `.gitattributes` exists (assumed `* text=auto` for cross-platform).
- **Tests**: Vitest setup with coverage reporting; no skips evident.
- **README**: Comprehensive with badges (npm, CI, release, Renovate, semantic-release, Conventional Commits, license, node, TypeScript).
- **Complexity**: ESLint rule `complexity: ["warn", 20]`.
- **Consistent Commands**: `npm run lint`, `format`, `format:check`, `test`, `typecheck`, `verify` (alias for ci).
- **No .env**: Absent from repo.

### Gaps and Issues

- **Unruly Code/Optimization**: Src/scripts may have minor redundancies (e.g., in generators); low test coverage in edge cases (e.g., Bazel opt-out); potential "any" types in src (to verify/fix).
- **Test Coverage**: V8 coverage enabled but no enforced threshold (target 80%+); gaps in schema validation edge cases.
- **Strict Typing Warnings**: Strict enabled, but no explicit warnings for legacy; zero tolerance not enforced.
- **Security Warnings**: No ESLint security plugin; no `npm audit` or Semgrep in hooks/CI.
- **Warnings Cleanup**: Existing ESLint complexity warns; potential type warns; enforce zero post-cleanup.
- **Circular Dependencies**: No dependency-cruiser; add to prevent.
- **Eliminate "any"**: Scan and refactor unless critical.
- **YAML Linting**: No yaml-lint tool; add for .github/workflows, configs.
- **Push Hooks**: Pre-push missing (e.g., for tests, security scans); add to match CI.
- **Code Complexity Analysis**: ESLint complexity warn only; add dependency-cruiser for broader static analysis.
- **Security Scans**: Missing `npm audit` (basic), Semgrep (advanced) in hooks/CI.
- **AI Agent Prompt**: Add specified prompt to `AGENT-SAFETY.md`.
- **Human Dev Notes in README**: Add sections on NVM/Versionfox, Python PATH, line endings, pre-commit formatting, pre-push tests.
- **Badges**: Add for coverage (e.g., Codecov if free), dependency freshness (David-DM), security (Snyk if free), but only automatic/free ones.
- **Cross-Platform**: Explicit .gitattributes confirmation; Python PATH note for multi-stack.
- **To-Do Items**:
  - Full elimination of "any" (if present; scan first).
  - Enforce coverage threshold in Vitest/CI.

## Phase 1: Update Dependencies and Cleanup Warnings

**Goal**: Ensure latest deps, resolve all existing warnings (lint, types, security), then enforce zero tolerance.

**Steps**:

1. Run `npm update` and resolve conflicts; use Renovate PR if needed (but manual for v7).
2. Scan for "any" types: Use `tsc --noEmit` and grep src for "any"; refactor to explicit types (e.g., generics in generators).
3. Fix ESLint warns: Run `npm run lint -- --fix`; manual fixes for complexity >20 (refactor functions).
4. Add ESLint plugin for security: `@eslint-plugin/security` (install as devDep); enable rules (e.g., `security/detect-object-injection: "error"`).
5. Run initial `npm audit fix`; add `npm audit --audit-level=high` to `npm run verify`.
6. Update tsconfig: Add `"noImplicitAny": true` (already in strict, but confirm).
7. Clean YAML: Install `yaml-lint` as devDep; add `npm run yaml-lint` script (`yaml-lint .github/**/*.yml renovate.json .releaserc.json`); fix issues.
8. Commit: `feat: update deps, fix all warnings, add security linting` (ensure verify passes).

**Expected Changes**:

- package.json: Updated versions, new devDeps (eslint-plugin-security, yaml-lint).
- eslint.config.mjs: Add security plugin and rules (error for new).
- scripts: Add yaml-lint.
- src: Refactored for no "any".

## Phase 2: Enhance Hooks and CI for Full Automation

**Goal**: Automate all checks in hooks/CI; add push hooks; match push to CI.

**Steps**:

1. Install `husky` (already present); add pre-push hook: `npm run test && npm run typecheck && npm audit && semgrep ci` (install `semgrep` as devDep if needed; use `@semgrep/ci`).
2. Update lint-staged: Add typecheck (`tsc --noEmit --pretty`) and yaml-lint to staged.
3. Enforce coverage: Update vitest.config.ts: Add `coverage: { thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 } }`.
4. Add dependency-cruiser: Install as devDep; add script `npm run dep-cruise` (`depcruise src --config`); config to ban circulars, max depth; add to verify and pre-push.
5. Update CI workflows (ci.yml): Mirror `npm run verify` + semgrep, dep-cruise; add stage for security scans.
6. Confirm .gitattributes: Ensure `* text=auto eol=lf` for cross-platform.
7. Add pre-push tests: Explicit in husky pre-push.
8. Commit: `feat: enhance hooks/CI with push checks, coverage thresholds, dep-cruiser`.

**Expected Changes**:

- .husky/pre-push: New file with commands.
- vitest.config.ts: Thresholds.
- package.json: New scripts (dep-cruise, yaml-lint), devDeps (dependency-cruiser, semgrep).
- .github/workflows/ci.yml: Updated jobs/steps.

## Phase 3: Optimize Code, Add Test Coverage, and Harden Features

**Goal**: Address unruly code, fill test gaps, prevent regressions.

**Steps**:

1. Review src/scripts/test: Identify gaps (e.g., Bazel edge cases, CI filters); add tests (aim 90%+ coverage).
2. Optimize: Refactor generators for modularity (e.g., separate validation); fix root causes in failing tests (if any).
3. Add complexity analysis: Integrate dep-cruiser reports in CI (fail on circulars/high complexity).
4. Run full verify; fix any new issues.
5. Commit: `refactor: optimize code, add test coverage for gaps`.

**Expected Changes**:

- test/: New/updated tests.
- src/: Refactored modules.

## Phase 4: Update Documentation and Badges

**Goal**: Top-notch README; add AI prompt; human notes.

**Steps**:

1. Update README.md:
   - Accuracy: Reflect v7 changes (e.g., new tools, commands).
   - Add badges: Coverage (if Codecov integrated, free), deps (david-dm), security (npm audit badge if possible), complexity (none paid).
   - Human section: "Developer Setup" – Use NVM/Versionfox with .nvmrc; Ensure Python on PATH for Python stacks; Line endings handled via .gitattributes; Formatting on pre-commit; Tests/security on pre-push.
2. Update AGENT-SAFETY.md: Add prompt: "This must be done professionally with enterprise-grade best practices at the forefront. Take your time and do the work correctly. Plan as needed so that we are efficient. Carefully review the /docs, tests, and code to gain a full understanding of this code repository. Then thoroughly verify the code to create an implementation plan for the following items. Commit each phase to current branch after ensuring that all CI and quality checks pass. If you encounter failures they must be fixed in a professional, enterprise-grade fashion whether or not they were pre-existing."
3. Ensure badges auto-update (e.g., GitHub Actions for CI).
4. Commit: `docs: enhance README with badges, dev notes; add AI prompt`.

**Expected Changes**:

- README.md: New sections, badges.
- AGENT-SAFETY.md: Updated.

## Phase 5: Final Validation and Major Bump

**Goal**: Prepare for release.

**Steps**:

1. Run full suite: `npm run verify`, manual audit for "any", circulars.
2. Update schema version in config/standards.json to 7; sync via script.
3. Commit: `BREAKING CHANGE: v7 enhancements for enterprise best practices` (triggers major bump).

**Post-Merge**: Semantic-release handles changelog, tag v7.0.0.

## To-Do Items (Post-v7 if Incomplete)

- If "any" remains critical: Document rationale in code comments.
- Integrate Codecov for coverage badge (free tier).

This plan ensures downstream consumers inherit automated, robust standards efficiently.
