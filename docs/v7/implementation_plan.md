# v7 Implementation Plan for @oddessentials/repo-standards

> **BREAKING CHANGE**: This major version introduces enterprise-grade quality gates, strict typing enforcement, AI agent safety invariants, comprehensive security scanning, dependency governance, hook/CI parity, and standardized commands. Downstream consumers must adopt the new standards without backwards compatibility guarantees.

## Objective

Create a forward-looking, enterprise-grade repository standards package that downstream consumers (across stacks like TypeScript/JS, C#/.NET, Python, Rust, Go) can adopt deterministically. This v7 release prioritizes automated enforcement of quality, security, and architecture rules, drawing from consumer experiences such as unruly code, low test coverage, warning regressions, security gaps, and inconsistent workflows. The plan ensures efficient adoption by embedding lessons like zero-tolerance for new violations, phased cleanups, and AI-safe automation to prevent common pitfalls (e.g., .env exposures, skipped tests, circular dependencies).

The autonomous software engineering team will work on a feature branch (e.g., `feat/v7-overhaul`). Each phase ends with a Conventional Commit after passing `npm run verify` (lint, format:check, typecheck, test, security, policy checks) and all CI workflows. Final merge to `main` triggers semantic-release for v7.0.0.

## Guiding Principles (North Star Invariants)

These are non-negotiable, enforced via hooks, CI, and documentation:

1. **Standardized Command Surface**: All repos use identical scripts (e.g., `npm run format`, `npm run verify`) for consistency.
2. **Strict Typing by Default**: `strict: true` with additional flags; `@typescript-eslint/no-explicit-any: "error"` (escape hatches require `// ANY_OK: [ticket]`).
3. **Zero-Tolerance for New Violations**: Zero tolerance for lint, type, and security warnings. All existing violations must be resolved during Phase 0.
4. **Hook/CI Parity**: Pre-push runs the same `npm run verify` as CI.
5. **Security-First**: Automated scans (npm audit, Semgrep) block merges.
6. **Dependency Hygiene**: Weekly Renovate updates; ban circulars via dependency-cruiser.
7. **AI Agent Safety**: Never modify `.env*`; never commit/push to `main`; never skip tests without documented human approval.
8. **Automation Over Manual**: No manual changelog/versioning; hooks handle formatting/linting.
9. **Cross-Platform Reliability**: Enforce LF line endings via `.gitattributes` and CI checks.
10. **Test Integrity**: 80%+ coverage threshold; no skips.

- Invariant: npm run verify is the sole compliance contract. Hooks and CI are required to converge on it and may not bypass or partially replace it.

## Current State Assessment

Based on repo analysis:

- **Strengths**: Existing Husky, commitlint, eslint, tsconfig, semantic-release, Renovate, .gitattributes.
- **Gaps**: Missing pre-push hooks, YAML linting, Semgrep, dependency-cruiser, env-guard; potential "any" usage, low coverage edges, warnings; incomplete README guidance.

| Component | Current                       | v7 Target                                                  |
| --------- | ----------------------------- | ---------------------------------------------------------- |
| Typing    | Strict enabled, but lax "any" | Zero "any"; all strict flags; errors fail builds           |
| Linting   | Basic ESLint                  | Type-aware, security plugin, zero warnings                 |
| Hooks     | Pre-commit only               | + Pre-push (full verify); commit-msg                       |
| CI        | Basic lint/test               | + Security, policy, coverage thresholds; parity with hooks |
| Security  | npm audit absent              | Audit + Semgrep in verify/CI                               |
| Deps      | Renovate present              | Weekly cadence; circular ban                               |
| Tests     | Vitest, no thresholds         | 80%+ enforced; full edge coverage                          |
| Docs      | Basic README                  | + Badges, dev notes, AI invariants                         |

## Implementation Phases

### Phase 0: Baseline Audit & Planning

**Goal**: Document current state, fix immediate warnings, plan fixes for gaps.
**Tasks**:

1. Run audits: `npm audit`, `npm run lint`, `tsc --noEmit`, Vitest coverage, grep for "any".
2. Create `docs/AUDIT.md`: Inventory scripts, hooks, CI, warnings (fix all existing before proceeding).
3. Update `docs/INVARIANTS.md`: List guiding principles with enforcement notes.
4. Scan/refactor "any" usages: Replace with types/generics; document critical escapes.
5. Commit: `feat: baseline audit and warning cleanup`.

**Deliverables**:

- Zero existing warnings/errors.
- AUDIT.md and INVARIANTS.md.

### Phase 1: Dependency & Foundation Hardening

**Goal**: Update deps, automate governance, enforce Node pinning.
**Tasks**:

1. Update all deps: `npx npm-check-updates -u; npm install; npm audit fix`.
2. Update `package.json` engines: `"node": ">=22.0.0", "npm": ">=10.0.0"`.
3. Update `.nvmrc`: `22`.
4. Configure Renovate (`renovate.json`):
   ```json
   {
     "$schema": "https://docs.renovatebot.com/renovate-schema.json",
     "extends": ["config:recommended", ":semanticCommits"],
     "schedule": ["after 6am and before 9am on Monday"],
     "automerge": true,
     "automergeType": "pr",
     "vulnerabilityAlerts": { "enabled": true, "labels": ["security"] },
     "packageRules": [
       { "matchUpdateTypes": ["patch", "minor"], "automerge": true },
       {
         "matchUpdateTypes": ["major"],
         "automerge": false,
         "labels": ["breaking-change"]
       }
     ]
   }
   ```
5. Add devDeps: `eslint-plugin-security`, `eslint-plugin-yml`, `dependency-cruiser`, `yamllint`, `@semgrep/ci`, `@vitest/coverage-v8`.
6. Commit: `chore(deps): update dependencies and configure Renovate`.

**Deliverables**:

- Clean `npm audit`.
- Automated weekly dep updates.

### Phase 2: Strict Typing & Linting Enforcement

**Goal**: Harden TS/ESLint for zero tolerance.
**Tasks**:

1. Update `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "NodeNext",
       "moduleResolution": "NodeNext",
       "esModuleInterop": true,
       "resolveJsonModule": true,
       "strict": true,
       "noImplicitAny": true,
       "noUncheckedIndexedAccess": true,
       "exactOptionalPropertyTypes": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "noFallthroughCasesInSwitch": true,
       "forceConsistentCasingInFileNames": true,
       "skipLibCheck": true,
       "declaration": true,
       "sourceMap": true,
       "types": ["node"]
     },
     "include": ["src", "scripts"],
     "exclude": ["dist", "node_modules"]
   }
   ```
2. Update `eslint.config.mjs` (flat config):

   ```javascript
   import tsPlugin from "@typescript-eslint/eslint-plugin";
   import tsParser from "@typescript-eslint/parser";
   import yamlPlugin from "eslint-plugin-yml";
   import security from "eslint-plugin-security";

   export default [
     {
       files: ["**/*.ts"],
       languageOptions: {
         parser: tsParser,
         parserOptions: { project: "./tsconfig.json" },
       },
       plugins: { "@typescript-eslint": tsPlugin, security },
       rules: {
         "@typescript-eslint/no-explicit-any": "error",
         "@typescript-eslint/no-unsafe-assignment": "error",
         "@typescript-eslint/no-unsafe-call": "error",
         "@typescript-eslint/no-floating-promises": "error",
         "security/detect-object-injection": "error",
         complexity: ["error", 15],
         "max-depth": ["error", 4],
       },
     },
     ...yamlPlugin.configs["flat/standard"],
     {
       files: ["**/*.yml", "**/*.yaml"],
       rules: { "yml/no-empty-document": "error" },
     },
   ];
   ```

3. Add YAML config (`.yamllint.yml`): Enforce 2-space indent, max line 120.
4. Update scripts: Add `lint:yaml: yamllint .`.
5. Commit: `feat: strict typing and linting enforcement`.

**Deliverables**:

- `npm run lint` and `tsc --noEmit` fail only on new violations.
- No "any" without documentation.

### Phase 3: Hooks & CI Parity

**Goal**: Automate local checks to mirror CI.
**Tasks**:

1. Update Husky: Add pre-commit (lint-staged), commit-msg (commitlint), pre-push (`npm run verify`).
   - `.husky/pre-commit`:
     ```bash
     npx lint-staged
     npm run typecheck
     ```
   - `.husky/pre-push`:
     ```bash
     npm run verify
     npm audit --audit-level=high
     npm run deps:check
     ```
2. lint-staged (`package.json`):
   ```json
   {
     "lint-staged": {
       "*.{ts,js}": ["prettier --write", "eslint --fix --max-warnings=0"],
       "*.{yml,yaml}": ["prettier --write", "eslint --fix"]
     }
   }
   ```
3. Update CI (`ci.yml`): Mirror `npm run verify`; add CRLF check, Semgrep.
4. Commit: `feat: hook/CI parity with pre-push verification`.

**Deliverables**:

- Hooks prevent bad pushes; CI blocks merges.

### Phase 4: Security & Policy Checks

**Goal**: Embed security and architecture gates.
**Tasks**:

1. Add Semgrep: Install, run in `verify` and CI.
2. Dependency-cruiser (`.dependency-cruiser.cjs`): Ban circulars, orphans, devDep imports in prod.
3. Env-guard script: Fail if `.env*` staged (add to pre-commit/CI).
4. Update scripts: `security: npm audit --audit-level=high && semgrep ci`, `deps:check: depcruise src --config`.
5. Commit: `feat: security scanning and policy enforcement`.

**Deliverables**:

- No merges with vulnerabilities/circulars/.env changes.

### Phase 5: Testing & Coverage

**Goal**: Ensure robust tests.
**Tasks**:

1. Update Vitest: Add coverage thresholds in `vitest.config.ts`: `{ thresholds: { lines: 80, functions: 80 } }`.
2. Add tests for gaps (e.g., schema edges, generators).
3. Commit: `test: enhance coverage and enforce thresholds`.

**Deliverables**:

- 80%+ coverage; tests in `verify`.

### Phase 6: Commit, Release & Cross-Platform

**Goal**: Automate versioning, enforce line endings.
**Tasks**:

1. Update commitlint: Enforce types/scopes.
2. Semantic-release (`.releaserc.json`): Auto-changelog, GitHub releases.
3. .gitattributes: `* text=auto eol=lf`; CI check for CRLF in scripts.
4. Commit: `feat: release automation and cross-platform hardening`.

**Deliverables**:

- Auto-changelogs; no newline regressions.

### Phase 7: Documentation & AI Safety

All governance documents (INVARIANTS.md, COMMANDS.md, GOVERNANCE.md) MUST live in /docs and MUST NOT be duplicated or modified in /templates.

**Goal**: Guide consumers and agents.
**Tasks**:

1. Update README: Add badges (CI, coverage, deps, security via Shields.io), dev notes (NVM, Python PATH, hooks behavior).
2. Update AGENT-SAFETY.md: Embed prompt: "This must be done professionally... Commit each phase... fix failures professionally."
3. Add GOVERNANCE.md: Branch protections, AI invariants.
4. Commit: `docs: overhaul README and add AI safety guidance`.

**Deliverables**:

- Comprehensive docs; AI-safe prompts.

### Phase 8: Final Validation & Release

**Goal**: Prepare v7.

1. Run full verify; sync schema to v7.
2. Commit: `BREAKING CHANGE: v7 enterprise standards overhaul`.

## Success Criteria

- v7 published with updated schema/docs.
- Downstream adoption path clear (e.g., copy scripts/hooks).
- All invariants enforced; zero regressions.

## Risks & Mitigations

| Risk                | Impact | Mitigation                               |
| ------------------- | ------ | ---------------------------------------- |
| CI time increase    | Medium | Warning-only for legacy; optimize scans. |
| Strict typing churn | High   | Phased fixes; escape hatches.            |
| Agent violations    | High   | Hard-fail guards; docs.                  |
| Dep update breaks   | Low    | Renovate staging; tests.                 |
