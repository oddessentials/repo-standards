# P0 — Pattern Extraction & Traceability Matrix

**Status:** Approved with refinements (2026-04-20) — ready to hand off to P1
**Purpose:** Catalog every reusable quality-gate pattern targeted for migration into `@oddessentials/repo-standards` so consumers inherit them as defaults rather than rediscovering them in production. One row per pattern, classified by tier, stack applicability, and implementation maturity.
**Scope:** Planning artifact only. No `config/standards.json` edits, no templates, no code changes until the decisions here are executed by the numbered phases.

---

## 1. Why this document exists

The patterns catalogued below are drawn from production-hardened multi-stack repos: hook dispatchers, ratchet gates, parity matrices, rule-disable proofs, schema-migration invariants, marker-based bypass conventions. They represent defect-class prevention that's easy to miss when standing up a new repo and expensive to retrofit. This doc is the review surface for _which_ of those patterns flow into `repo-standards`, _at what tier_, _for which stacks_, and _with what implementation maturity_. It is the contract that P1 (policy-lane), P2 (template-lane), P3 (`apply`-extension), and P4 (dogfood) execute against.

## 2. Classification rubric

### Tier

- **Core.** Applies to essentially all serious repos. Low implementation cost. Pattern prevents a defect class that is common and high-impact, or it's a near-universal ecosystem convention. Not opinionated beyond "do this or explain why not."
- **Recommended.** Applies to most repos but not all. Moderate implementation cost. Significant quality/safety win. Some opinionation — the pattern has design choices consumers may want to adapt.
- **Recommended (conditional on X).** Recommended _if_ condition X holds. Marked when a pattern only has value paired with another adopted pattern, or when it only applies to a subset of repos.
- **Optional.** Applies to hardened / mature repos, or to a specific scenario (has-a-database, ships-compiled-UI-bundle, etc.). Higher implementation cost or higher opinionation. Good pattern, but not the first thing a new repo should adopt.

### Stack applicability

- **All.** Universal — language-agnostic, works anywhere.
- **All (concept); {stacks} (impl).** Principle is universal; first-class reference implementation exists for the listed stacks. Others adapt idiomatically.
- **{stacks}.** Only applies to the listed stacks.
- **Conditional on {X}.** Only applies if condition holds (e.g., "conditional on shipping a relational schema").

### Implementation maturity

Every checklist item shipped to `config/standards.json` carries an `implementation_maturity` field so consumers can tell _documented_ from _ready-to-copy_:

- `documented` — pattern described in instructions/docs; no template shipped yet.
- `template-planned` — template scheduled for a named milestone, not yet written.
- `template-available` — template exists under `templates/patterns/<id>/`; consumers can copy-and-adapt immediately.

**P1 constraint:** any checklist item landing before its template exists MUST set `implementation_maturity` to `documented` or `template-planned` so it isn't surfaced as ready-to-adopt. The field is exposed in the generated `instructions.<stack>.md` so consumers see it directly.

## 3. Category inventory

| #   | Category                   | Scope                                                                            |
| --- | -------------------------- | -------------------------------------------------------------------------------- |
| 1   | `local-ci-parity`          | Parity doc + the test that keeps the doc honest                                  |
| 2   | `hooks-and-orchestration`  | Tiered hook model, dispatcher scripts, exit-code contract                        |
| 3   | `quality-gates`            | Linters, formatters, type checkers, split TS configs                             |
| 4   | `test-discipline`          | Coverage thresholds, test-count floors, ratchets, platform filtering             |
| 5   | `commit-and-release`       | Conventional commits, semantic-release, version/threshold guards, bypass markers |
| 6   | `ci-infrastructure`        | Workflow-level guards: lockfile, package-manager, line-ending, artifact parity   |
| 7   | `security-gates`           | Secret scan, suppression audit, rule-disable proofs, command allowlists          |
| 8   | `dev-environment`          | Engines pins, editorconfig, package-manager exclusivity                          |
| 9   | `documentation-invariants` | CLI reference drift, generated-artifact byte-parity                              |
| 10  | **`persistence` (NEW)**    | Schema/migration parity, DDL byte-equivalence, required-tables runtime           |
| 11  | `agent-integration`        | `.claude/settings.json` dispatch, agent-safety invariants                        |
| 12  | `meta-patterns`            | Cross-cutting design principles (adversarial-proof, churn-bait discipline, etc.) |

## 4. Pattern catalog

New items added in this P0 pass (versus the initial strategy sketch) are flagged **🆕**.

### 4.1 `local-ci-parity`

| ID                                | Pattern                                                                                                                                                                                                 | Tier | Stacks                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ---------------------------- |
| `lcp-parity-doc`                  | Row-per-gate matrix (e.g., `LOCAL_CI_PARITY_INVARIANTS.md`) citing every local gate with its CI equivalent + Match/Weaker/Partial status                                                                | Rec  | All                          |
| `lcp-parity-doc-coverage-test` 🆕 | AST-walk the preflight runner; assert every gate's canonical identifier appears as a double-quoted string in the parity doc. Adversarial negative tests required (see `mp-adversarial-proof-required`). | Rec  | All (concept); Python (impl) |

**Scope-discipline note for `lcp-parity-doc-coverage-test` (load-bearing):** The test locks _canonical identifier presence only_. It must NOT be extended to lock prose, row counts, link shapes, or Prevention-Proof wording. Doing so makes the test churn-bait and consumers will remove it. This note belongs verbatim in the template README.

### 4.2 `hooks-and-orchestration`

| ID                           | Pattern                                                                                                                                                                                         | Tier     | Stacks                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------- |
| `hook-tiered-model`          | Tier 1 (pre-commit, staged-only, fast) → Tier 2 (pre-push, CI-identical preflight) → Tier 3 (CI-only)                                                                                           | Rec      | All                                         |
| `hook-dispatcher-script`     | Single entrypoint that routes `pre-commit` / `pre-push` / `commit-msg` based on argv, handles tool-missing / network cases cleanly                                                              | Rec      | All (concept); Python or POSIX shell (impl) |
| `hook-preflight-script`      | Single entrypoint that runs the CI-identical superset; pre-push delegates to it                                                                                                                 | Rec      | All (concept); Python or POSIX shell (impl) |
| `hook-exit-code-contract`    | `EXIT_GATE=1` (quality regression, fatal), `EXIT_SETUP=2` (tool missing, fatal), `EXIT_INFRA=3` (network, skippable with `--allow-local-degraded`). Contract identical across all hook scripts. | **Core** | All                                         |
| `hook-fail-fast-setup-check` | Upfront validation that `.husky/` exists and hook harness is installed before running any gates                                                                                                 | Rec      | All                                         |

### 4.3 `quality-gates`

| ID                     | Pattern                                                                                                                                                               | Tier | Stacks                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------------ |
| `qg-zero-warnings`     | Lint runs with `--max-warnings=0` (or equivalent); warning == failure                                                                                                 | Core | All                      |
| `qg-strict-types`      | Strict type checker enabled across src/ with documented per-module overrides (mypy strict, tsc strict, etc.)                                                          | Core | TS, Python, Rust, Go, C# |
| `qg-justified-ignores` | Every linter ignore / suppression includes a comment justifying it; zero silent suppressions                                                                          | Rec  | All                      |
| `qg-split-ts-configs`  | Separate `tsconfig.json` / `tsconfig.build.json` / `tsconfig.test.json` / `tsconfig.type-tests.json` with a guard test locking `module`/`moduleResolution` per config | Opt  | TS                       |
| `qg-no-any-types`      | Guard that forbids `typing.Any` / `any` in src/, tests/, scripts/ with allowlist for justified cases                                                                  | Opt  | TS, Python               |

### 4.4 `test-discipline`

| ID                                   | Pattern                                                                                                                                               | Tier | Stacks                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------- |
| `td-coverage-threshold`              | Coverage threshold enforced in CI; consumers set their own floor                                                                                      | Core | All                             |
| `td-coverage-ratchet`                | Threshold formula `floor(actual - 2.0)`; raise-only; CI fails on regression                                                                           | Rec  | All                             |
| `td-coverage-tiered`                 | Global baseline + per-file Tier 2 thresholds for critical paths (schemas, parsers, security boundaries)                                               | Rec  | All                             |
| `td-coverage-delta-guard`            | Coverage-delta gate (e.g., no drop > 2% between PR and main)                                                                                          | Rec  | All                             |
| `td-patch-coverage`                  | Patch coverage must meet threshold; Codecov project status parity                                                                                     | Opt  | All                             |
| `td-test-floor-contract`             | `.test-floor-contract.json` pins `min_collected` count; CI reads authoritatively (no hardcoded integers)                                              | Rec  | All                             |
| `td-ratchet-bump-guard`              | Per-commit equality check: `collected == floor` after any floor bump; walks first-parent range; subprocess-isolated collection to match CI exactly    | Rec  | All (concept); Python (impl)    |
| `td-zero-skips`                      | `--max-skips=0` zero-tolerance skip gate; collection-time exclusion > `pytest.mark.skip`                                                              | Opt  | Python (impl); concept portable |
| `td-platform-conditional-collection` | Shared glob patterns imported by both `conftest.py` and the ratchet gate; AST-level parity test asserts both sites import the same constant           | Opt  | Python (impl); concept portable |
| `td-canonical-runtime`               | One canonical OS + runtime version used for threshold comparison (e.g., ubuntu-latest + Python 3.12); other matrix legs don't gate thresholds         | Opt  | All                             |
| `td-subprocess-isolated-collection`  | Test collection runs in a clean subprocess (`PYTEST_DISABLE_PLUGIN_AUTOLOAD=1`, cleared addopts) with count written to a tempfile — no stdout parsing | Opt  | Python (impl); concept portable |
| `td-partial-branch-ratchet`          | LCOV partial-branches baseline with locked-zero files list                                                                                            | Opt  | TS                              |

### 4.5 `commit-and-release`

| ID                             | Pattern                                                                                                                                                                                                                                                  | Tier                                                                  | Stacks                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------- |
| `cr-conventional-commits`      | Commitlint with `@commitlint/config-conventional`; extended `type-enum` for project-specific types (e.g., `ratchet`)                                                                                                                                     | Core                                                                  | All                        |
| `cr-semantic-release`          | semantic-release on `main` only; git plugin commits version files; `[skip ci]` convention                                                                                                                                                                | Rec                                                                   | All                        |
| `cr-version-guard`             | Pre-push gate blocks manual version bumps when semantic-release owns versioning. Bypass: subject-line `[version-override-acknowledged]`. Never bypassed for direct-to-main pushes.                                                                       | Rec                                                                   | All (concept); Node (impl) |
| `cr-threshold-change-guard`    | CI gate blocks coverage-threshold changes unless commit subject includes `[threshold-update]` marker                                                                                                                                                     | Rec                                                                   | All                        |
| `cr-marker-bypass-convention`  | Subject-line-only markers for documented bypass cases (`[threshold-update]`, `[ratchet-realignment]`, `[ratchet-test-removal]`, `[version-override-acknowledged]`); bodies ignored; scanned via `git log --oneline` with shallow-clone determinism guard | **Rec (conditional on adopting any ratchet/threshold/version guard)** | All                        |
| `cr-shallow-clone-determinism` | When scanning commits for markers, fetch without `--depth=N`; cross-check `git log {base}..HEAD` against `git rev-list --count`; fail if they disagree                                                                                                   | Opt                                                                   | All                        |

### 4.6 `ci-infrastructure`

| ID                                    | Pattern                                                                                                                            | Tier | Stacks                                      |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------------------------------------- |
| `ci-package-manager-exclusivity`      | Preinstall script exits 1 if wrong package manager is used. Examples: pnpm-only repos reject npm; `engine-strict=true` in `.npmrc` | Core | Node                                        |
| `ci-lockfile-discipline`              | CI gate fails on presence of wrong lockfile (e.g., zero `package-lock.json` outside `node_modules/` in a pnpm repo)                | Core | Node                                        |
| `ci-package-manager-command-guard`    | CI gate scans workflows/scripts/configs for forbidden package-manager commands (e.g., `npm install`/`npm ci` in a pnpm repo)       | Rec  | Node                                        |
| `ci-line-ending-guard`                | CRLF detector for hooks, shell scripts, CI scripts, bundled UI. Prevents package imports from introducing CRLF                     | Core | All                                         |
| `ci-generated-artifact-byte-parity`   | CI verifies any checked-in generated artifact is byte-identical to what a fresh generation would produce                           | Opt  | Conditional on shipping generated artifacts |
| `ci-breaking-change-marker`           | CI gate blocks major-version bumps of contract files unless commit message contains a `BREAKING <CONTRACT>:` marker                | Opt  | Conditional on shipping versioned contracts |
| `ci-cross-platform-test-count-parity` | Compare test counts between OS matrix legs (ubuntu vs windows) to catch platform-filter bugs                                       | Opt  | All                                         |

### 4.7 `security-gates`

| ID                                | Pattern                                                                                                                                                                                                | Tier | Stacks                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- | ---------------------------- |
| `sec-secret-scan`                 | gitleaks with project allowlist; full-history scan on PR (`fetch-depth: 0`)                                                                                                                            | Core | All                          |
| `sec-dependency-audit`            | `npm audit --audit-level=high` (or stack equivalent) in pre-push + CI                                                                                                                                  | Core | All                          |
| `sec-rule-disable-proof-artifact` | For every globally disabled lint rule, ship a committed proof artifact (e.g., `.rule-disable-audit-<rule>.json`) listing every call-site and the compensating control. Exact-match check on every run. | Rec  | All                          |
| `sec-rule-disable-guardrail`      | For every globally disabled rule, ship a custom validator that enforces the compensating control. Uses tokenizer (not regex) to avoid false positives in string literals.                              | Opt  | All (concept); Python (impl) |
| `sec-suppression-audit`           | Scope-based suppression baseline (e.g., `.suppression-baseline.json`) with zero-tolerance `scope_policy: blocking`. Baseline regenerated and staleness-checked on every run.                           | Rec  | All                          |
| `sec-subprocess-allowlist`        | Whitelist for repo-owned non-literal subprocess commands; verified by guardrail                                                                                                                        | Opt  | Python                       |
| `sec-helper-enforcement`          | CI gate that blocks direct use of primitives where a safer helper is required (example: pagination tokens must route through a wrapper rather than being concatenated directly)                        | Opt  | All (pattern-level)          |

### 4.8 `dev-environment`

| ID                        | Pattern                                                                                                                                                        | Tier | Stacks |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------ |
| `de-engines-pinned`       | `engines` field in `package.json` pins node + package-manager version; `.nvmrc` / `.tool-versions` / `pyproject.toml:requires-python` for the language runtime | Core | All    |
| `de-packagemanager-field` | `packageManager` field in `package.json` matches engines pin; validated by a CI guard                                                                          | Core | Node   |
| `de-editorconfig`         | `.editorconfig` with UTF-8, LF, trim trailing whitespace, final newline; explicit overrides for Python (4-space), JSON/YAML (2-space), Windows batch (CRLF)    | Core | All    |
| `de-engine-strict`        | `.npmrc` sets `engine-strict=true` to enforce engines field                                                                                                    | Core | Node   |

### 4.9 `documentation-invariants`

| ID                        | Pattern                                                                                                                                                                                                 | Tier | Stacks                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------------------------- |
| `doc-cli-reference-drift` | Auto-generated CLI reference with golden-SHA check. Canonical Python only (argparse rendering differs across versions). `--check` mode returns `[SKIP]` on non-canonical runtime (fail-close on write). | Opt  | Conditional on shipping a CLI |
| `doc-help-snapshots`      | Per-subcommand help snapshots committed for diff visibility                                                                                                                                             | Opt  | Conditional on shipping a CLI |

### 4.10 `persistence` 🆕

| ID                                   | Pattern                                                                                                                                                                                            | Tier | Stacks                           |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | -------------------------------- |
| `p-schema-migration-parity` 🆕       | Parity test: every table declared in the canonical schema source MUST either be in a designated "fundamental" set OR be created by at least one registered migration. Test-only, no runtime hooks. | Rec  | All (concept); Python (impl)     |
| `p-migration-ddl-parity` 🆕          | PRAGMA/DDL byte-equivalence between the canonical schema source and a DB built by running all migrations against a blank start                                                                     | Opt  | Conditional on relational schema |
| `p-required-tables-runtime-check` 🆕 | Two-phase runtime validation at DB connect: "fundamental" tables must exist before migrations run; "required" tables must exist after. Defense-in-depth alongside the parity test.                 | Rec  | Conditional on relational schema |
| `p-schema-version-monotonic` 🆕      | CI gate: `schema_version` seed in canonical SQL matches `max(target_version)` in the migration registry. Catches "added migration, forgot to bump seed."                                           | Rec  | Conditional on relational schema |
| `p-migration-test-coverage` 🆕       | Every registered migration has at least one test exercising it: (a) on a blank DB, (b) on the prior schema version. Enforced by a coverage check over the migration registry.                      | Rec  | Conditional on relational schema |

**Applicability note:** All `persistence` items are conditional on the repo shipping a relational schema + migration registry. For repos without, all items evaluate as N/A (same mechanism as existing stack-applicability). We'll define "has-a-database" via a file-scanner signal in P1 (e.g., presence of a `migrations/` directory, or a `persistence.declared` metadata field).

### 4.11 `agent-integration`

| ID                           | Pattern                                                                                                                                                   | Tier | Stacks |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------ |
| `ai-claude-hook-dispatch`    | `.claude/settings.json` with pre/post/session hooks dispatching to a single orchestrator (binary or stack-native dispatcher)                              | Opt  | All    |
| `ai-agent-safety-invariants` | Ship `INVARIANTS.md` + phase-gates + victory-gates per the existing templates in this repo. _Already present; pattern is about ensuring consumers adopt._ | Rec  | All    |

### 4.12 `meta-patterns` (cross-cutting design principles)

These are not individual checklist items — they are design principles that apply _across_ multiple patterns and belong in the template READMEs for every pattern they govern. They will be delivered as a single `docs/patterns/meta-principles.md` that every template's README links to in a standard "Design principles this template obeys" footer.

| ID                                      | Principle                                                                                                                                                                                                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mp-adversarial-proof-required` 🆕      | Any invariant-asserting test MUST include adversarial negative tests proving it catches the regression case. Without proof-of-catch, "enforcement" is unverified. Applies to: parity tests, ratchet gates, rule-disable guardrails, any `check_*` script. |
| `mp-churn-bait-discipline` 🆕           | Parity / drift tests lock _canonical identifiers_ only, never prose/wording/row-counts/link-shapes. Violations turn the test into a maintenance burden and consumers will remove it.                                                                      |
| `mp-committed-proof-artifacts`          | Any claim that is hard to verify by code inspection alone (disabled-rule safety, subprocess-allowlist coverage, fundamental-table membership) should be backed by a committed JSON manifest that is diffable in PR and exact-match-checked on every run.  |
| `mp-defense-in-depth`                   | Where feasible, pair a _shift-left_ gate (PR-time parity test) with a _runtime_ gate (connect-time / request-time check). They catch the same defect class at different costs.                                                                            |
| `mp-point-in-time-structural-claims` 🆕 | Any structural claim in a pattern doc (counts, file lists, identifier inventories) is verified-at-commit, not eternal. Pattern docs should say so explicitly and tell implementers to re-verify before acting.                                            |
| `mp-authoritative-contract-file`        | Where a number or invariant is shared across multiple sites (CI + local preflight + ratchet gate), put it in a single contract JSON with an `authority` field pointing at the canonical producer. No hardcoded integers in multiple places.               |
| `mp-enforce-helpers-over-primitives`    | When a helper exists to make an operation safe, CI should forbid direct use of the underlying primitive. The helper's existence is not enough — the primitive must be blocked.                                                                            |
| `mp-allowlist-over-blocklist`           | For security-sensitive surfaces (subprocess commands, CI-runnable actions, dependency sources), allowlist known-good. Blocklists of known-bad are unbounded.                                                                                              |

## 5. Deferred / out-of-scope

Patterns explicitly NOT migrating in this pass, with reason:

| Pattern                                                                                                                  | Reason                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| External monorepo hook-dispatcher integrations                                                                           | Project-specific orchestration binaries aren't generalizable. Consumers should wire their own dispatcher; the `hook-dispatcher-script` pattern gives them the shape. |
| Azure DevOps extension / VSIX-specific patterns (task major-version guards, VSIX inspection, extension version-stamping) | Too narrow — specific to ADO extension repos. If there's demand we can ship a `vsix-extension` template pack later, but it doesn't belong in the base catalog.       |
| Tool-version alignment for language-specific ecosystem stubs (e.g., pandas-stubs ↔ pandas major version)                 | Ecosystem-specific; the _principle_ (tool-version consistency) is already captured by `de-engines-pinned` + possible future `de-tool-version-consistency`.           |
| Compiled UI bundle synchronization specifics                                                                             | The _principle_ is captured as `ci-generated-artifact-byte-parity`; specific implementation details stay in the consumer's repo.                                     |
| Synthetic-dataset / demo workflow patterns                                                                               | Single-purpose demo-generation flows, not generalizable.                                                                                                             |

## 6. Decisions log

Resolved during review (2026-04-20):

1. **Category name: `persistence`.** ✅ Resolved. Five items in the new category, all conditional on relational schema.
2. **`hook-exit-code-contract` tier.** ✅ Stays **Core**. It's small but foundational glue for any hook ecosystem — inconsistent exit semantics create ambiguity immediately. Cheap to adopt.
3. **`sec-suppression-audit` tier.** ✅ Stays **Recommended**. Value is real but setup cost is materially higher than strict-types / line-ending / package-manager items. Keeping it Recommended preserves credibility.
4. **`cr-marker-bypass-convention` tier.** ✅ Changed to **Recommended (conditional on adopting any ratchet/threshold/version guard)**. Essential once those guards exist; policy surface without them.
5. **`sec-rule-disable-proof-artifact` tier.** ✅ Stays **Recommended**. Borderline but more opinionated than `qg-zero-warnings` / `de-editorconfig`; not ready to promote to Core-as-project-philosophy.
6. **Stack-first coverage for templates.** ✅ **Python + TS first; concept-documented for others.** Avoids fake generality. Better to ship excellent first-class examples for the dominant source patterns than weak pseudo-templates for every stack.
7. **Template-drift prevention strategy.** ✅ **Vendored templates with provenance.** Re-fetch-and-diff CI is too expensive for this phase; URL-only references would undermine the "copy and implement now" goal. **Provenance lives in template READMEs only**, in the single-line form `adapted from <source>@<sha>`. It does NOT appear in `config/standards.json`, in `instructions.<stack>.md`, or in any policy doc. That specific line in each `templates/patterns/<id>/README.md` is the only in-repo surface where provenance is permitted.
8. **Meta-patterns delivery.** ✅ Single `docs/patterns/meta-principles.md` that every pattern template's README links to in a standard "Design principles this template obeys" footer. (No objection raised in review; adopted.)
9. **Implementation-maturity signal — machine-enforced.** ✅ **New requirement.** Every checklist item in `config/standards.json` carries a **required** `maturity` field with values `documented` / `template-planned` / `template-available`. Schema validation rejects items missing the field — not a documentation convention, not a lint, a hard schema constraint. Items landing in P1 before their P2 template exists must be one of the first two. Surfaced inline in generated `instructions.<stack>.md` so consumers can tell ready-to-copy from documented-only. (See Section 2.)
10. **Project-agnostic content.** ✅ **New constraint.** Nothing in `config/standards.json`, `instructions.<stack>.md`, or any policy doc names origin projects. Patterns are described by _what they do_ and _what defect class they prevent_. The only in-repo place provenance may appear is a single-line `adapted from <source>@<sha>` in template READMEs (see decision 7).
11. **Conditions mechanism — first-class, not deferred.** ✅ **New decision.** A `conditions` array on each checklist item (e.g., `["has-database"]`, `["has-cli"]`) is a P1 deliverable. Detection via file-based heuristics (`migrations/` present, `package.json:bin` defined, etc.), with an optional override in a consumer repo-config file. Conditional items render as "not applicable" in `verify` output when the condition doesn't hold. Without this, conditional items become noise in `verify` within 2–3 iterations.
12. **Verify / doctor output — tier-grouped, Core-first.** ✅ **New constraint.** Output groups findings by tier (Core / Recommended / Optional) and surfaces Core failures first. Progress shown as per-tier completion percentages, not just total-failure count. This is not UX polish — walls of check names undermine adoption and turn the catalog into background noise.
13. **Meta-principles footer in every template README — unavoidable.** ✅ **New constraint.** Every `templates/patterns/<id>/README.md` ends with a standard footer: "This pattern follows: <mp-ids>" linking to `docs/patterns/meta-principles.md`. A P2 CI gate verifies footer presence across all pattern READMEs so meta-principles don't rot into ignored prose.

## 7. What's next for P1

P1 delivers in this order — consumer-visible impact first, so each step produces something observable in `verify` output before moving on:

1. **Schema change + tier-grouped verify output + Core items.** Extend `config/standards.json` schema with required `maturity` (enum of `documented` / `template-planned` / `template-available`) and optional `conditions` (string array). Update `verify` / `doctor` output to group findings by tier and surface Core failures first. Add every Core-tier item from Sections 4.1–4.11. Acceptance: a consumer running `verify` immediately sees new Core additions under a clearly labeled "Core" grouping with per-tier progress.
2. **Maturity signal wiring.** Schema validation rejects items missing `maturity`. Generated `instructions.<stack>.md` surfaces the maturity value inline for every item. Acceptance: items with `maturity: documented` render visibly distinct from `template-available` ones; a missing `maturity` field causes spec generation to fail loudly.
3. **Conditions mechanism.** File-based detection (`migrations/`, `package.json:bin`, etc.) + optional override in a repo-config file. Conditional items render as "N/A — condition X not met" in `verify` output when the condition doesn't hold. Acceptance: persistence items evaluate as N/A in a repo without a schema; evaluate as active in a repo that declares one.
4. **Recommended items.** Add all Recommended patterns (including the conditional-Recommended `cr-marker-bypass-convention`).
5. **Optional items.** Add all Optional patterns last. Spec is now complete.
6. **Meta-principles doc.** Ship `docs/patterns/meta-principles.md` capturing Section 4.12. This sets up P2's template-README footer convention.

**P1 acceptance check:** generated `instructions.<stack>.md` for every supported stack compiles cleanly; new patterns render at the right tier with accurate maturity; conditional items render "N/A" when their condition is unmet; `verify` output is tier-grouped and surfaces Core failures first; schema validation rejects any item missing `maturity`.

P2 follows with templates (Python + TS first) under `templates/patterns/<id>/`. Each README carries scope-discipline notes where applicable (especially `lcp-parity-doc-coverage-test` and any other test that locks identifier presence), a one-line `adapted from <source>@<sha>` provenance line, and the standard meta-principles footer. A P2 CI gate enforces footer presence across all pattern READMEs.

---

**Document status:** approved with P1 hardening (2026-04-20). P1 may begin.

---

## Appendix A — P1.4/P1.4b cross-reference outcomes

Resolution of each catalog item against existing `config/standards.json` entries, recorded as items landed. Kept as a traceability record so the DUPLICATE classifications can be revisited if future evidence changes the judgment.

### Added as new items (P1.4 / P1.4b)

**P1.4 — 1 Core + 11 Recommended:**

- `hook-exit-code-contract` (Core)
- `lcp-parity-doc`, `lcp-parity-doc-coverage-test` (Rec)
- `hook-tiered-model`, `hook-dispatcher-script`, `hook-preflight-script`, `hook-fail-fast-setup-check` (Rec)
- `p-schema-migration-parity`, `p-migration-ddl-parity`, `p-required-tables-runtime-check`, `p-schema-version-monotonic`, `p-migration-test-coverage` (Rec, conditional on `has-database`)

**P1.4b — 8 Core + 11 Recommended:**

- Net-new Core: `ci-package-manager-exclusivity`, `ci-lockfile-discipline`, `de-packagemanager-field`, `de-editorconfig`, `de-engine-strict`
- Complement Core (adds distinct discipline over an existing item): `qg-zero-warnings`, `sec-secret-scan-ci`, `cr-semantic-release`
- Net-new Recommended: `qg-justified-ignores`, `td-coverage-ratchet`, `td-coverage-tiered`, `td-coverage-delta-guard`, `td-test-floor-contract`, `td-ratchet-bump-guard`, `cr-threshold-change-guard`, `cr-marker-bypass-convention`, `ci-package-manager-command-guard`, `sec-rule-disable-proof-artifact`, `sec-suppression-audit`

### Deferred as DUPLICATE of an existing item

Classified as fully covered by the listed existing item. Not added in P1.4/P1.4b. Revisit if a concrete distinction emerges during template work in P2.

| Catalog ID                   | Covered by existing item                                          | Notes                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `qg-strict-types`            | `type-checking`                                                   | Existing item already calls out strictness on new code.                                                |
| `td-coverage-threshold`      | `unit-test-reporter`                                              | Existing item sets an ~80% threshold. The ratchet + tiered + delta patterns were added as complements. |
| `cr-conventional-commits`    | `commit-linting`                                                  | Existing item explicitly names Conventional Commits.                                                   |
| `ci-line-ending-guard`       | `crlf-detection` + `gitattributes-eol`                            | Existing two items cover CI CRLF detection and source-layer EOL enforcement.                           |
| `sec-dependency-audit`       | `dependency-security`                                             | Existing item covers lockfile + vuln scanning + CI fail-on-high.                                       |
| `de-engines-pinned`          | `runtime-version`                                                 | Existing item covers `engines` field and runtime pins.                                                 |
| `cr-version-guard`           | `version-guard`                                                   | Existing item is essentially the same pattern.                                                         |
| `ai-agent-safety-invariants` | `agent-invariants` (+ `agent-phase-gates`, `agent-victory-gates`) | Existing trio already covers INVARIANTS.md + phase/victory gates.                                      |

### P1.5 — 18 Optional items

All Optional-tier catalog items added in a single batch. Per-item stack applicability:

- **TypeScript-only:** `qg-split-ts-configs`, `td-partial-branch-ratchet`
- **TypeScript + Python:** `qg-no-any-types`
- **Python-only:** `sec-subprocess-allowlist`
- **All stacks:** `td-patch-coverage`, `td-zero-skips`, `td-platform-conditional-collection`, `td-canonical-runtime`, `td-subprocess-isolated-collection`, `cr-shallow-clone-determinism`, `ci-generated-artifact-byte-parity`, `ci-breaking-change-marker`, `ci-cross-platform-test-count-parity`, `sec-rule-disable-guardrail`, `sec-helper-enforcement`, `ai-claude-hook-dispatch`
- **All stacks, `conditions: ["has-cli"]`:** `doc-cli-reference-drift`, `doc-help-snapshots`

All ship at `maturity: "documented"` with `enforcement: "optional"` and `severity: "info"`. Descriptions lift the pattern's intent and defect-class prevention from the Section 4 catalog entries.

### Closing state (post-P1.5)

Catalog totals: **38 Core + 34 Recommended + 21 Optional = 93 items** (up from 44 pre-P1). Every item carries `maturity`; persistence items carry `conditions: ["has-database"]`; CLI-documentation items carry `conditions: ["has-cli"]`. The 8 DUPLICATE-classified catalog items remain deferred per the table above; revisit if template work in P2 surfaces a concrete distinction.
