# Repository Standards Instructions

> Auto-generated from `config\standards.typescript-js.github-actions.json`
> Stack: TypeScript / JavaScript | CI: github-actions

This document provides high-level guidance for an autonomous coding agent to bring a repository into compliance with the defined standards.

## Core Requirements

### Git Attributes (Line Endings)

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Enforce line endings at the Git layer using .gitattributes. Mark text files with appropriate EOL handling (eol=lf for shell scripts, eol=auto for most files) and binary files as binary to prevent corruption. This prevents 'works locally, fails in CI' issues caused by CRLF/LF mismatches.
- Ensure .gitattributes exists in the repository.
- Consider adding .editorconfig if applicable.

### CRLF Detection in CI

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Fail CI early for Linux-executed files containing CRLF line endings. Shell scripts, Python files, and other interpreted files fail silently or with cryptic errors when they contain \r characters. Detect this before running deeper CI steps.
- Check for CRLF in .sh, .js, .ts, .json files early in CI. Use 'file' command or grep for \r to detect issues before they cause cryptic failures.

### Git and Docker Ignore Files

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Maintain proper .gitignore and .dockerignore files to prevent committing secrets, build artifacts, or unnecessary files.
- Ensure .gitignore exists in the repository.
- Consider adding .dockerignore if applicable.

### Linting

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Run static code linting to enforce consistency and catch common issues early.
- Consider adding .prettierrc, prettier.config.js, prettier.config.cjs and others if applicable.
- Define a `lint` script or equivalent command.
- Treat new lint errors as CI failures; keep existing issues as warnings until addressed.

### Unit Test Runner

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Provide a deterministic unit test framework with a single command to run all tests.
- Consider adding jest.config.js, jest.config.ts, vitest.config.js and others if applicable.
- Define a `test` script or equivalent command.
- Keep unit tests fast and deterministic; move slow or flaky tests into integration or E2E suites.

### Containerization (Docker / Docker Compose)

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Provide a Dockerfile and, if applicable, a docker-compose file for local dev and CI parity.
- Ensure Dockerfile exists in the repository.
- Consider adding docker-compose.yml if applicable.
- Use multi-stage builds and pin Node.js and base image versions in the Dockerfile to match CI (e.g., node:22-alpine).

### Semantic Versioning

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Use MAJOR.MINOR.PATCH versioning with clear rules and automated changelog generation based on commit history. Maintain a single canonical version source (for example, package.json or VERSION) that all release artifacts use.
- Ensure package.json exists in the repository.
- Consider adding VERSION, CHANGELOG.md if applicable.
- Define a `release` script or equivalent command.

### Version Guard (Automated Releases)

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- If semantic-release or automated versioning is enabled, block manual edits to canonical version fields in pull requests. Enforce a CI guard (and optional pre-push hook) that fails when version lines change outside the release workflow.
- Ensure package.json exists in the repository.
- Consider adding VERSION if applicable.

### Release Artifact Formatter Exclusion

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Exclude auto-generated release artifacts (CHANGELOG.md, package-lock.json, etc.) from code formatters to prevent CI failures. Release automation tools generate files that may not conform to your formatter's style, causing format checks to fail on subsequent CI runs.
- Ensure .prettierignore exists in the repository.

### Unified Release Workflow

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Use a single CI release pipeline that publishes all artifacts (GitHub releases, packages, containers) from the same canonical version source.
- Consider adding CHANGELOG.md, VERSION if applicable.
- Define a `release` script or equivalent command.

### Release Hook Bypass

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Release automation must bypass local developer hooks (HUSKY=0, --no-verify) and rely solely on CI gates for validation. This ensures idempotent, reproducible releases that don't fail due to hook environment differences.

### Commit Linting

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Enforce structured commit messages such as Conventional Commits via commit-msg hooks and CI. This is required for deterministic versioning and changelog generation.
- Define a `commitlint` script or equivalent command.
- Enforce Conventional Commits via commit-msg hooks (e.g., Husky) and a CI job so versioning/changelog automation is deterministic.

### Unit Test Reporter / Coverage

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Generate readable unit test and coverage reports and enforce a minimum coverage threshold (around 80%) for new or changed code.
- Collect coverage in lcov or similar format; use diff coverage so legacy gaps are visible but non-blocking.

### CI Quality Gates

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Single CI pipeline that runs linting, formatting, type checking, tests, coverage, build, and containerization.
- Expose a single npm script (e.g., `npm run ci`) that mirrors the CI pipeline so contributors can reproduce failures locally.

### Code Formatter

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Automatic code formatting to maintain a consistent style across all contributors.
- Run Prettier in check mode in CI; auto-fix locally via pre-commit hooks or editor integration.

### Pre-Commit Hooks

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Use git hooks to run linting, formatting, and commit linting before changes are committed. Hooks should CHECK by default (not auto-fix), be fast, and scope to changed files only. Use a single entry hook mechanism (e.g., Husky as entry point calling pre-commit or lint-staged).

### Hook/CI Parity

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Local hooks and CI must invoke identical verification commands to prevent 'works locally, fails in CI' issues. Use a single canonical verify entrypoint (e.g., npm run verify) that both hooks and CI call.
- Define a `verify` script or equivalent command.

### Pre-commit Secret Scanning

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Scan staged diffs for credentials, API keys, and secrets before they reach the remote repository. Catch secrets at commit time rather than after they're pushed.
- Add gitleaks or detect-secrets to pre-commit hooks. Scan only staged changes for speed. Configure allowlists for false positives in .gitleaks.toml.

### Type Checking

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Use static type checking to catch errors before runtime and enforce strictness on new code. For JS/TS stacks, require a TypeScript-first policy with strict mode and a CI typecheck step; allow JSDoc/checkJs migration for legacy JS.
- Ensure tsconfig.json exists in the repository.
- Define a `typecheck` script or equivalent command.

### Dependency Management & Vulnerability Scanning

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Lock dependencies and scan regularly for known vulnerabilities; fail CI on newly introduced high-severity issues.
- Consider adding package-lock.json, pnpm-lock.yaml, yarn.lock if applicable.
- Require a lockfile for reproducible installs and pin Node.js/tooling versions; block merges on new high-severity vulnerabilities.

### Deterministic & Hermetic Builds

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Ensure builds are reproducible by pinning dependencies, base images, and tool/runtime versions. Avoid network/time variance and fail when lockfiles drift.
- Consider adding .nvmrc, .tool-versions if applicable.

### Provenance & Security Metadata

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Produce SBOMs or provenance metadata, enable secret/code scanning, and sign tags or commits for critical repos.
- Consider adding SECURITY.md, .github/workflows/codeql.yml if applicable.
- Generate SBOM/provenance for npm and container artifacts, enable secret scanning, and sign tags/commits for protected branches.

### CI Templates & Automation

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Adopt standard CI templates and config samples to scale across repositories, minimizing bespoke pipeline logic.
- Define a `ci` script or equivalent command.
- Use shared CI templates for lint/test/build/release stages and keep repo-specific overrides minimal.

### Runtime Version Specification

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Specify required runtime/engine versions in package manifests appropriate for your application. Use minimum version constraints (>=) rather than strict ranges to avoid blocking consumers from upgrading.
- Ensure package.json exists in the repository.

### Documentation Standards

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Maintain a comprehensive README and, where applicable, auto-generated API docs to support onboarding and maintainability.
- Ensure README.md exists in the repository.
- Consider adding docs/, typedoc.json if applicable.
- README should describe setup, scripts, and architecture; generate API docs from TypeScript types and JSDoc where helpful.

### Repository Governance

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Include standard governance files (LICENSE, CODE_OF_CONDUCT.md, CONTRIBUTING.md), branch protection rules, and review standards to define legal, ethical, and workflow expectations.
- Ensure LICENSE exists in the repository.
- Consider adding CODE_OF_CONDUCT.md, CONTRIBUTING.md if applicable.
- Use an SPDX license identifier in package.json and describe review expectations, tests, and docs requirements in CONTRIBUTING.md.

### Canonical Verify Entrypoint

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Provide one canonical 'verify' command per repository/stack that all stages call with appropriate flags. This prevents duplication, drift, and ensures consistency between local development and CI.
- Define a `verify` script or equivalent command.

### Config File Authority Rules

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Each configuration rule must live in exactly one authoritative config file. Avoid duplication across .editorconfig, linter configs, and CI definitions. Document which file is authoritative for each concern.

### Explicit Skip Paths

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Encode path exclusions and skip rules deterministically in config files, not through ad-hoc human judgment. Make it clear which paths are excluded from checks and why.

### Hook Exit-Code Contract

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Three-value exit-code contract shared across all hook scripts and CI preflight runners: 1 = quality regression (fatal), 2 = missing tool (fatal, setup issue), 3 = network or infra degraded (skippable with --allow-local-degraded). Inconsistent exit semantics across hooks mask real failures and undermine local/CI parity.

### Package Manager Exclusivity

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Enforce a single package manager per repo via a preinstall script that exits non-zero if the wrong one is invoked. Combined with engine-strict, prevents lockfile drift and npm/pnpm mixed installs that break reproducibility.

### Lockfile Discipline

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- CI gate fails on the presence of any unauthorized lockfile — e.g., a package-lock.json in a pnpm repo, or a yarn.lock in an npm repo. Companion to package-manager exclusivity; catches wrong-tool installs that slip past the preinstall guard.

### packageManager Field

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- package.json declares a pinned `packageManager` field (e.g., "pnpm@9.15.0") that Corepack and CI can use to auto-select the correct tool + version. Keeps the package-manager exclusivity guard and engine pins aligned with one authoritative source.

### EditorConfig

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Ship an .editorconfig at the repo root pinning UTF-8 charset, LF line endings, trimmed trailing whitespace, and inserted final newline. Overrides by extension for language-specific indent widths and any Windows-only exceptions (e.g., CRLF for .bat). Eliminates an entire class of cross-platform whitespace drift before linters run.

### engine-strict Enforcement

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Set engine-strict=true in .npmrc (or equivalent) so the engines field in package.json becomes a hard install-time constraint, not advisory. Prevents 'works on my machine' drift from mismatched Node or package-manager versions.

### Zero-Warnings Lint Discipline

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Run the linter with --max-warnings=0 (or equivalent) so any warning becomes a failure. Complements the generic linting requirement by forcing warnings to be resolved at authorship time rather than accumulating as background noise.

### Full-History Secret Scan in CI

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Run a secret scanner (e.g., gitleaks) in CI against the full git history on every PR — fetch-depth: 0. Complements pre-commit secret scanning by catching anything that slipped in via force-push, rebase, or a developer without hooks installed.

### semantic-release Integration

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Use semantic-release (or equivalent) on the main branch only, with a git plugin that commits version and changelog files and a [skip ci] convention on the release commit. Complements the unified release workflow with a specific, deterministic tool stack that enforces conventional-commit-driven versioning.

## Recommended Practices

### Dependency Update Automation

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Automate dependency updates using Renovate or Dependabot to keep dependencies current and reduce security exposure window.

### Dependency Architecture Rules

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Enforce module boundaries and import constraints to prevent architectural drift and unwanted coupling.
- Define forbidden imports, layer rules, and circular dependency bans. Run in CI as blocking check.

### Integration Testing

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Test how components interact with each other and external systems, running after unit tests with more relaxed coverage thresholds.
- Use Supertest for HTTP APIs and Playwright or similar tools for end-to-end flows; keep integration suites slower but reliable.

### Performance Baselines

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Establish performance baselines and monitor for regressions using lightweight benchmarks or audits in CI.
- Run Lighthouse CI for web apps and basic Node benchmarks on critical endpoints; schedule runs or limit to key branches to keep CI fast.

### Complexity Analysis

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Measure cyclomatic complexity or similar metrics to keep code maintainable, starting as a warning-only check.
- Warn on overly complex functions and methods; fail CI only when new or modified code exceeds thresholds.

### Accessibility Auditing

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Run accessibility checks on web-facing components to detect critical issues and improve inclusive UX.
- Run accessibility checks against key pages or components in CI; fail on critical violations while treating minor issues as warnings initially.

### AI Drift Detection

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Run nightly or scheduled checks comparing AI-generated outputs against pinned baselines to detect model drift, prompt drift, or code changes affecting AI behavior. Attribute regressions to code changes vs model updates vs prompt changes.

### AI Output Schema Enforcement

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Validate all AI-generated outputs against strict JSON schemas or type definitions at system boundaries. Reject invalid outputs early rather than letting malformed data propagate through the system.

### AI Golden Contract Tests

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Validate AI tool-generated patches, configs, and code against exact expected formats. Test that AI outputs respect forbidden paths, file patterns, and format constraints through golden contract tests.

### AI Adversarial & Safety Testing

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Test AI integrations for prompt injection resistance, input sanitization, output filtering, and data exfiltration prevention. Include adversarial test cases that attempt to manipulate AI behavior.

### AI Provenance & Audit Logging

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Log AI provider, model version, prompt template version, parameters, and tool versions for all AI operations. Enable attribution of outputs to specific model+prompt combinations for debugging and compliance.

### Autonomous Agent Invariants

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Maintain INVARIANTS.md defining repository-wide rules that must always hold true, with machine-readable verification commands for autonomous agents.
- Ensure INVARIANTS.md exists in the repository.

### Local/CI Parity Invariants Document

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- A row-per-gate matrix — typically LOCAL_CI_PARITY_INVARIANTS.md — that maps every local gate to its CI equivalent with a status column (Match / Weaker / Partial). Makes parity gaps concretely auditable and prevents 'works locally' drift.

### Parity Doc Coverage Test

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Static test that AST-walks the local preflight runner, collects every gate's canonical identifier, and asserts each appears in the parity doc. Lock scope to identifier presence only — never prose, row counts, or link shapes — or the test devolves into churn-bait. Must include adversarial negative tests proving it catches fabricated and removed gates.

### Tiered Hook Model

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Hook checks organize into three tiers: pre-commit (staged-only, fast), pre-push (CI-identical preflight superset), CI (remote-only jobs). Makes the local/CI boundary explicit and keeps fast-feedback checks from drifting toward either extreme.

### Hook Dispatcher Script

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Single entrypoint script that husky hooks delegate to. Routes pre-commit / pre-push / commit-msg based on argv, centralizes exit-code handling, tool detection, and network-degraded behavior so individual hook files stay thin and consistent.

### Pre-Push Preflight Script

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Dedicated script that runs the CI-identical superset of gates. Pre-push hook invokes it; CI can also invoke it. Keeps local and CI verification paths mechanically equivalent rather than merely 'similar.'

### Fail-Fast Hook Setup Check

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Hook scripts verify prerequisites upfront — .husky/ present, required tools on PATH, harness wired — and fail with a setup-specific exit code when any are missing. Prevents silent hook bypass after bad installs, branch switches, or dependency drift.

### Schema/Migration Parity Test

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Static test asserting every table declared in the canonical schema source is either in a 'fundamental' set (present since inception) or created by at least one registered migration. Shifts detection of 'added table to schema, forgot the migration' from production runtime to PR CI.

### Migration DDL Byte-Parity

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- PRAGMA/DDL byte-equivalence test between (a) the canonical schema source and (b) a DB built by running every registered migration against a blank start. Catches semantic drift between inline schema and incremental migrations.

### Required-Tables Runtime Check

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- At DB connect time, validate table presence in two phases — 'fundamental' tables before any migrations run, 'required' tables after all migrations apply. Defense-in-depth alongside the parity test; catches the same defect class at runtime if it escapes PR gating.

### Schema Version Seed Monotonic

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- CI gate asserting the schema_version seed in the canonical schema source equals max(target_version) across all registered migrations. Catches 'added migration, forgot to bump seed' — where the DB migrates to v7 but schema source still claims v6.

### Per-Migration Test Coverage

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Every registered migration has at least one test exercising it on a blank DB AND on the prior schema version. Enforced by a coverage check over the migration registry. Blocks untested migrations from shipping.

### Justified Lint Ignores

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Every linter ignore or suppression comment includes an inline justification explaining why the rule doesn't apply in that specific case. Zero silent suppressions; reviewers can audit the trade-off directly at the call site.

### Coverage Ratchet (Raise-Only)

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Coverage threshold computed as floor(actual - 2.0); CI fails on regression below the ratchet but allows raises. Makes coverage monotonically improve over time without requiring human-maintained magic numbers.

### Tiered Coverage Thresholds

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Global coverage baseline supplemented by per-file Tier 2 thresholds for critical paths — schemas, parsers, auth boundaries, security-sensitive surfaces. Keeps high-risk code at a higher bar without demanding the same bar of every file.

### Coverage Delta Guard

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- CI gate fails when the PR's coverage drops by more than a small delta (e.g., 2%) vs. main, even if the absolute number still sits above the ratchet. Catches silent coverage erosion that ratchets alone miss.

### Test Floor Contract

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Commit a machine-readable contract file (e.g., .test-floor-contract.json) that pins the minimum collected test count. CI reads this authoritatively — no hardcoded integers in workflow files. Catches silent test removal that coverage alone wouldn't flag.

### Ratchet Bump Equality Guard

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Per-commit gate asserting collected test count equals the floor exactly after any floor bump. Walks the first-parent commit range in subprocess-isolated pytest (or equivalent) so the check matches CI's collection exactly. Prevents 'bumped the floor but tests changed' drift.

### Threshold Change Marker Guard

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- CI gate blocks coverage-threshold changes unless the commit subject contains a [threshold-update] marker. Keeps accidental threshold drift from slipping through reviews while still allowing intentional adjustments with a clear audit trail.

### Commit-Subject Marker Bypass Convention

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Subject-line-only markers (e.g., [threshold-update], [ratchet-realignment], [version-override-acknowledged]) document cases where a strict gate is intentionally bypassed. Scanned via git log --oneline with shallow-clone determinism checks. Only meaningful once ratchet/threshold/version guards exist; adopt alongside them.

### Package-Manager Command Guard

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- CI gate scans workflows, scripts, and configs for forbidden package-manager commands — e.g., 'npm install' or 'npm ci' in a pnpm-exclusive repo. Catches drift that the preinstall guard alone won't: workflow-file edits that bypass installs entirely.

### Rule-Disable Proof Artifact

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- For every globally disabled lint rule, ship a committed proof artifact (e.g., .rule-disable-audit-<rule>.json) listing every affected call-site and the compensating control. Verified by an exact-match check on every run so new call-sites can't silently inherit the disable.

### Suppression Audit with Baseline

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Scope-based suppression baseline (e.g., .suppression-baseline.json) with zero-tolerance scope policy: any new suppression outside the baseline blocks the commit. Baseline is regenerated and staleness-checked on every run so it can't silently grow stale.

## Optional Enhancements

### Observability (Logging & Error Handling)

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Standardize error handling and structured logging to make debugging and production monitoring easier.
- Adopt structured JSON logging with correlation IDs and send logs to a centralized sink in production.

### Agent Phase Gates

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Define phase transition requirements in phase-gates.md for autonomous agent workflows with clear pre-conditions and approval gates.
- Consider adding phase-gates.md if applicable.

### Agent Victory Gates

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Document milestone completion criteria in victory-gates.md defining 'done' for releases and major deliverables with evidence requirements.
- Consider adding victory-gates.md if applicable.

### Split TypeScript Configs

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Separate tsconfig files for typecheck (strict, bundler resolution), build (emit, CommonJS or ESM as appropriate), tests, and type-tests. A guard test locks module/moduleResolution per config so tsc cannot silently overwrite an IIFE bundle with a CommonJS one, or vice versa.

### No any / Any Types

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- CI gate forbidding 'any' (TypeScript) or 'typing.Any' (Python) in src/, tests/, and scripts/ except for a small allowlist with inline justifications. Prevents silently-typed escape hatches from accumulating undetected over time.

### Patch Coverage Gate

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Gate on patch coverage (e.g., via Codecov project status or equivalent) asserting newly-added lines meet a minimum bar, separate from the global coverage ratchet. Keeps new code honest even when overall coverage sits safely above threshold.

### Zero-Skips Test Collection

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Test collection runs with zero-tolerance for skipped tests — e.g., pytest --max-skips=0. Skips become failures; prefer collection-time exclusion patterns (platform filters, custom markers) over per-test skip decorators so skips remain visible.

### Platform-Conditional Test Collection Parity

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Shared glob constants imported by both the test runner's conftest (or equivalent) and the ratchet-bump gate so platform-conditional collection stays identical across both sites. AST-level parity test asserts both sites import the same canonical constant name rather than drifting into divergent literal lists.

### Canonical Runtime Baseline

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Pin one canonical OS + runtime version as the baseline for coverage, test counts, and any threshold comparison — e.g., ubuntu-latest + Python 3.12. Other matrix legs run tests but do not gate thresholds, so argparse rendering or stdlib diffs cannot destabilize CI.

### Subprocess-Isolated Test Collection

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Ratchet-bump and count-check scripts invoke the test runner in a clean subprocess with plugin autoload disabled and addopts cleared, writing the count to a tempfile instead of parsing stdout. Guarantees local ratchet measurement matches CI byte-for-byte regardless of dev-machine plugin state.

### LCOV Partial-Branch Ratchet

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- LCOV partial-branches baseline with a locked-zero files list. CI fails if a file on the locked-zero list develops any partial branches. Catches a class of untested conditional branches that line and statement coverage alone do not detect.

### Shallow-Clone Marker-Scan Determinism

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- When scanning commit history for markers (bypass, version-override, etc.), fetch without --depth=N. Cross-check the count from git log {base}..HEAD against git rev-list --count and fail the gate if they disagree. Prevents shallow-clone-related silent marker misses on CI runners.

### Generated-Artifact Byte-Parity

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- CI verifies that any checked-in generated artifact — compiled UI bundle, golden docs, mirrored schema, etc. — is byte-identical to what a fresh regeneration would produce. Applies only to repos that check in generated files. Catches manual edits that would be silently overwritten on the next regeneration.

### Breaking-Change Marker Gate

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- CI gate blocks major-version bumps of contract files (schemas, task definitions, API specs) unless the commit message contains a project-defined marker such as 'BREAKING <CONTRACT>:'. Applies only to repos that ship versioned contracts. Forces breaking changes through an explicit review checkpoint.

### Cross-Platform Test-Count Parity

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Compare test counts between OS matrix legs (ubuntu vs windows vs macos, etc.) and fail the gate on unexpected disagreement. Catches platform-filter bugs where a test silently collects on only one OS due to an accidental glob or marker.

### Rule-Disable Compensating Guardrail

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- For every globally disabled lint rule, ship a custom validator that enforces the compensating control — e.g., if S603 (subprocess) is disabled, a guardrail verifies every subprocess call is either a string literal or appears in an allowlist. Uses tokenizer-based parsing (not regex) to avoid false positives inside string literals. Runs alongside the proof artifact as defense-in-depth.

### Helper-Over-Primitive Enforcement

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- CI gate blocks direct use of primitives where a safer helper exists — for example, pagination tokens must route through a helper function rather than being string-concatenated, or crypto primitives must go through a project wrapper. The helper's existence alone is not enough; the underlying primitive must be blocked.

### CLI Reference Drift Guard

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Auto-generate the CLI reference doc (e.g., docs/reference/cli-reference.md) and commit a golden SHA of the expected output. CI regenerates and compares. Use a canonical runtime only (argparse and equivalent CLI formatters render differently across language/runtime versions); --check mode returns [SKIP] on non-canonical runtimes; fail-close in write mode.

### Per-Subcommand Help Snapshots

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- Commit per-subcommand help-output snapshots so any accidental change to --help text is visible in PR diff. Paired with the CLI reference drift guard to give full CLI documentation coverage — drift guard catches added/removed commands; snapshots catch wording changes on existing commands.

### Claude Code Hook Dispatch

> **Maturity:** `documented` — described here; no ready-to-copy template yet

- .claude/settings.json wires pre/post/session hooks to a single orchestrator binary or stack-native dispatcher. Centralizes agent-invoked checks so they don't drift from human-invoked pre-commit / pre-push hooks or CI. Keeps the agent, the developer, and CI on the same verification path.
