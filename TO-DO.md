PHASE ONE:

## A) Line endings and cross-platform execution (non-negotiable)

1. **Enforce EOL at the Git layer with `.gitattributes`, not just editor settings.** Git attributes can force `eol=lf` for files executed in Linux (shell hooks, CI scripts) and `eol=crlf` only where Windows truly requires it (bat/cmd). ([Git SCM][1])

2. **Keep `.editorconfig` to align editors/IDEs, but treat it as a supplement.** EditorConfig standardizes editor behavior across tools, but it cannot control all non-editor file writes (generators, patch tools, some IDE actions). ([EditorConfig][2])

3. **Explicitly mark binaries as `binary` (or `-text`) in `.gitattributes`.** This prevents Git from attempting line-ending normalization on files that must remain byte-identical (images, PDFs, archives). ([GitHub Docs][3])

4. **Add a CI “CRLF detector” that fails fast for Linux-executed files.** Scan `.husky/*`, `**/*.sh`, `.github/scripts/**`, and other CI-executed scripts for `\r` and fail with an actionable message before the pipeline runs deeper steps.

5. **After adding/changing `.gitattributes`, do a one-time “renormalize” commit.** This converts existing tracked files to the policy so you don’t keep landmines around and re-trigger failures later.

6. **Windows contributors: disable surprise conversions in Git.** Prefer `core.autocrlf=false` with `.gitattributes` as the repo truth; this reduces “it worked locally but not in CI” churn. ([Git SCM][4])

---

## B) Hook strategy (polyglot repos)

7. **Use one “entry hook” mechanism and one authoritative check definition.** For polyglot repos, it’s normal to have Husky (Node ecosystem) as the entry point and pre-commit (or equivalent) as the authoritative definition for multi-language hooks. ([Pre-commit][5])

8. **Never let enforcement drift between local and CI.** The exact same “verify” commands (or hook runners) must be invoked by both local hooks and CI; when they diverge, CI becomes the first time developers learn they broke policy.

9. **Hooks must be deterministic and environment-pinned.** Always invoke formatters/linters/tests through the repo’s toolchain wrapper (your language’s package manager / pinned runner) so “which binary ran?” never depends on PATH.

10. **Hooks should “check” by default, not auto-fix.** Auto-fixing inside hooks often changes staged content unexpectedly; make fixing an explicit developer action (format command), while hooks fail with clear remediation.

11. **Make hooks fast by default and scope to changed files where possible.** Fast local feedback increases compliance; use staged-file filtering or a tool like `lint-staged` for Node-based workflows. ([npm][6])

12. **Release automation should disable local hooks and rely on CI gates.** If release tooling performs `git push` in CI, set `HUSKY=0` (or equivalent) and depend on required CI checks; hooks are a developer UX layer, not a release dependency.

---

## C) What must run when (quality gates by stage)

### Pre-commit (seconds; “cheap and local”)

13. **Formatting checks for touched files.** Run format *check* (not fix) for files being committed; fail with exact command to fix.

14. **Static lint + obvious correctness checks for touched files.** Lint rules, import sorting, basic type checks (lightweight modes), and forbidden-pattern checks (e.g., debug prints, TODO blockers if you enforce them).

15. **Secret scanning on staged diffs.** Prevent credential leaks before they ever reach the remote; keep it fast and diff-scoped.

16. **Policy checks that prevent irreversible damage.** Examples: generated file policy, lockfile consistency, “no large binaries,” forbidden paths, license headers (if required), and CRLF-on-Linux-script checks.

### Pre-push (tens of seconds to a few minutes; “protect CI”)

17. **Run the authoritative hook runner across the repo or affected modules.** This is where your Option 2 shines: Husky triggers pre-commit (or equivalent) with push-stage hooks so Python/Go/Rust/etc. checks are consistent. ([Pre-commit][5])

18. **Run unit tests for impacted components (or a fast test subset).** Prefer deterministic, no-network tests; allow skipping only with an explicit “break glass” mechanism you track.

19. **Run repo-specific “baseline integrity” checks.** Any golden-file, perf baseline, schema stability, ID stability, or snapshot verification that protects determinism belongs here if it’s fast enough.

### CI for Pull Requests (minutes; “merge gate”)

20. **Re-run all pre-push checks in a clean environment.** CI is the authority; it must not assume local hooks ran or ran correctly.

21. **Add reproducibility and determinism checks.** Ensure builds/tests do not depend on local machine state, time, locale, or network unless explicitly permitted (and then recorded).

22. **Run dependency and supply-chain checks at least at PR time.** Lockfile integrity, known-vuln scanning, and “no unsigned artifact ingestion” style rules (as applicable).

### CI on Main (minutes to longer; “release readiness”)

23. **Full test suite + packaging validation.** Include integration tests (containers/services), compatibility tests across supported runtimes, and artifact build verification.

24. **Performance baselines and regression guards (if you maintain baselines).** Make baseline updates explicit and reviewed; never “auto-accept” baseline changes in CI.

### Release pipeline (strictly deterministic; “no surprises”)

25. **Disable dev hooks and run only required CI gates.** Release should not depend on interactive or workstation-style hooks; it should depend on CI status checks + provenance.

26. **Tagging/versioning + changelog generation must be idempotent.** A re-run should not create inconsistent tags or divergent changelogs; ensure release scripts can be safely retried.

### Nightly/Weekly (heavier; “detect slow failures”)

27. **Full integration tests + long-running suites.** Include end-to-end tests, multi-platform builds, large-dataset tests, and cleanup/restore validations.

28. **Deep security and compliance sweeps.** SAST/DAST as relevant, dependency update simulations, license audits, secret scanning across the full repo history if needed.

---

## D) AI-specific gates (for apps that *use* or *build with* generative AI)

29. **Nightly “Drift Runs” are mandatory when outputs can change without code changes.** Re-run a pinned evaluation suite against a fixed dataset and compare results to last known-good (accuracy/quality scores, schemas, structured outputs, and latency/cost envelopes).

30. **Separate “model drift” from “code drift.”** Track model/provider/version, prompts, tool schemas, and evaluation data hashes so you can attribute a regression to the right cause (code vs provider vs prompt vs dependency).

31. **Enforce strict schemas at every boundary.** Any AI output consumed by the system must be validated (schema + invariants) and rejected/contained when invalid; never let malformed AI output silently corrupt state.

32. **Add determinism where you can, and record nondeterminism where you can’t.** Use fixed seeds/config for synthetic data, freeze time in tests, pin prompt versions, and log all provenance (provider, model, parameters, tool versions).

33. **Require “golden” contract tests for tool outputs.** If agents generate patches, configs, or JSON, validate exact formats, forbidden paths, and invariant files (e.g., INVARIANTS.md / victory gates) as part of CI merge gates.

34. **Run adversarial / safety checks on AI-facing surfaces.** For example: prompt injection resistance tests for tool-using agents, input sanitization tests, and “no secret exfiltration” checks for logs/artifacts.

---

## E) Practical “single source of truth” rules (to prevent reoccurrence)

35. **One canonical `verify` entrypoint per repo (or per stack) that all stages call.** Local hooks, CI, and release should call the same command(s) with stage-appropriate flags (fast vs full).

36. **Every rule must live in exactly one authoritative config.** `.gitattributes` for line endings; `.editorconfig` for editor behavior; hook runner config for hook composition; CI config for merge gates—avoid duplicated definitions that drift.

37. **Make “skip paths” explicit and rare.** If something is allowed to bypass checks (e.g., docs-only), encode it deterministically (path filters) rather than ad-hoc human judgment.

---

[1]: https://git-scm.com/docs/gitattributes?utm_source=chatgpt.com "Git - gitattributes Documentation"
[2]: https://spec.editorconfig.org/index.html?utm_source=chatgpt.com "EditorConfig Specification — EditorConfig Specification 0.17.2 ..."
[3]: https://docs.github.com/articles/dealing-with-line-endings?utm_source=chatgpt.com "Configuring Git to handle line endings"
[4]: https://git-scm.com/book/en/v2/Customizing-Git-Git-Configuration?utm_source=chatgpt.com "8.1 Customizing Git - Git Configuration"
[5]: https://pre-commit.com/?utm_source=chatgpt.com "pre-commit"
[6]: https://www.npmjs.com/package/lint-staged?activeTab=dependents&utm_source=chatgpt.com "lint-staged"



---

PHASE 2:

# TO-DO: OHM Integration for Repo Standards

## Background

This document captures the remaining work to integrate `@oddessentials/repo-standards` with the Odd Hive Mind (OHM) MCP gateway system.

### What Was Done (2026-01-03)

A comprehensive OHM MCP integration was completed across multiple repos:

| Phase   | Description                | Status                                  |
| ------- | -------------------------- | --------------------------------------- |
| Phase 1 | Two-Surface Registration   | ✅ Complete                             |
| Phase 2 | Stable Primitives Contract | ✅ Complete                             |
| Phase 3 | Pre-Work Enforcement       | ✅ Complete                             |
| Phase 4 | Cross-Tool Adoption        | ✅ Complete (odd-docs, odd-repo-mapper) |

**Key deliverables:**

1. **odd-hive-mind** (merged to main):
   - `src/primitives/envelope.ts` - JCS canonicalization, determinism from inputs
   - `src/primitives/safety.ts` - Path containment validation
   - `src/primitives/audit.ts` - Audit chain verification
   - `ohm/introspect` command with per-command capabilities

2. **oddessentials-mcp** (merged to main):
   - `gateway/tools/ohm-core/` - LOW risk surface (plan, replay, diff, introspect)
   - `gateway/tools/ohm-run/` - HIGH risk surface (run with rate limiting)
   - `gateway/src/identity.ts` - Identity extraction and audit logging
   - Network denial integration test

3. **odd-docs** and **odd-repo-mapper** (merged to main):
   - Local `safety.ts` mirroring OHM primitives API
   - Path validation for file writes
   - TODO: Replace with `@oddessentials/odd-hive-mind/primitives` when published

---

## Remaining Work for Repo Standards

### 1. Add OHM Primitives Dependency

When odd-hive-mind is published to npm:

```bash
npm install @oddessentials/odd-hive-mind
```

### 2. Adopt Safety Primitives

Replace current path validation with OHM primitives:

```typescript
// Before
import { validatePath } from "./local-safety";

// After
import {
  resolveAndCheckPath,
  checkForbidden,
} from "@oddessentials/odd-hive-mind/primitives/safety";
```

### 3. Adopt Envelope Primitives

Wrap standards validation outputs with deterministic envelopes:

```typescript
import {
  wrapInEnvelope,
  computeDeterminismKey,
  computePayloadHash,
} from "@oddessentials/odd-hive-mind/primitives/envelope";

// Wrap validation results
const result = validateStandards(targetRepo);
const envelope = wrapInEnvelope("repo-standards", "1.0.0", "validate", result);
```

### 4. Integrate with MCP Gateway

If repo-standards becomes an MCP tool:

1. Create `gateway/tools/repo-standards/manifest.json` in oddessentials-mcp
2. Create adapter following `ohm-core` pattern
3. Define capabilities: network DENY, filesystem read-only
4. Scope: `mcp:read` (no mutations)

### 5. Reference Implementation

See the following files for patterns:

| File                                                  | Purpose                         |
| ----------------------------------------------------- | ------------------------------- |
| `odd-hive-mind/src/primitives/envelope.ts`            | Determinism and payload hashing |
| `odd-hive-mind/src/primitives/safety.ts`              | Path containment                |
| `oddessentials-mcp/gateway/tools/ohm-core/adapter.ts` | LOW-risk tool adapter           |
| `odd-docs/src/core/safety.ts`                         | Local primitives implementation |

---

## Notes

- odd-hive-mind is currently `private: true` in package.json
- Publish to npm before adopting in other repos
- All primitives use JCS (RFC 8785) via `json-canonicalize@1.0.6`
- Network policy is advisory at Node.js level; real enforcement via container/sandbox
