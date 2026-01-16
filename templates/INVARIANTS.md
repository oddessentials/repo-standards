# Repository Invariants

Repository invariants are rules that **must always hold true**, regardless of what code is added or changed. Autonomous agents and CI systems use this file to validate repository state before and after changes.

## Format

Each invariant includes:

- **ID**: Unique identifier (e.g., `INV-001`)
- **Title**: Brief description
- **Verification**: Command or check to validate
- **Severity**: `error` (must pass) or `warn` (should pass)
- **Stage**: When to check (`pre-commit`, `pre-push`, `ci-pr`, `ci-main`, `release`, `nightly`)

---

## Foundation Invariants (Check First)

These prevent "works locally, fails in CI" issues. Check these before other invariants.

| ID      | Title                    | Verification                                                          | Severity | Stage      |
| ------- | ------------------------ | --------------------------------------------------------------------- | -------- | ---------- |
| INV-F01 | .gitattributes exists    | `test -f .gitattributes`                                              | error    | pre-commit |
| INV-F02 | No CRLF in shell scripts | `git ls-files --eol \| grep -E 'w/crlf.*\.sh$' && exit 1 \|\| exit 0` | error    | ci-pr      |
| INV-F03 | No CRLF in Python files  | `git ls-files --eol \| grep -E 'w/crlf.*\.py$' && exit 1 \|\| exit 0` | error    | ci-pr      |
| INV-F04 | Canonical verify exists  | `npm run verify --if-present` or `make verify`                        | error    | pre-commit |
| INV-F05 | Hook/CI parity           | Hooks and CI call same verify command                                 | error    | ci-pr      |

---

## Core Invariants

| ID      | Title                            | Verification                            | Severity | Stage      |
| ------- | -------------------------------- | --------------------------------------- | -------- | ---------- |
| INV-001 | All tests must pass              | `npm test` or `npm run verify`          | error    | pre-push   |
| INV-002 | No uncommitted changes           | `git status --porcelain` (empty output) | error    | pre-commit |
| INV-003 | Build succeeds                   | `npm run build`                         | error    | ci-pr      |
| INV-004 | Linting passes                   | `npm run lint`                          | error    | pre-commit |
| INV-005 | Formatting is consistent         | `npm run format:check`                  | error    | pre-commit |
| INV-006 | Type checking passes             | `npm run typecheck`                     | error    | pre-push   |
| INV-007 | Coverage threshold met           | `npm run test:coverage` (>= 80%)        | warn     | ci-pr      |
| INV-008 | No high-severity vulnerabilities | `npm audit --audit-level=high`          | error    | pre-push   |
| INV-009 | Lockfile is up-to-date           | `npm ci` (succeeds without changes)     | error    | ci-pr      |
| INV-010 | No secrets in staged files       | `gitleaks protect --staged`             | error    | pre-commit |

---

## AI/ML Invariants (If Applicable)

Skip this section if your repo has no AI/ML components.

| ID      | Title                   | Verification                          | Severity | Stage   |
| ------- | ----------------------- | ------------------------------------- | -------- | ------- |
| INV-A01 | AI outputs match schema | `npm run test:ai-schemas`             | error    | ci-pr   |
| INV-A02 | AI golden tests pass    | `npm run test:ai-golden`              | error    | ci-pr   |
| INV-A03 | AI safety tests pass    | `npm run test:ai-safety`              | error    | ci-main |
| INV-A04 | AI baselines stable     | `npm run test:ai-drift`               | warn     | nightly |
| INV-A05 | AI provenance logged    | Review logs for model+prompt versions | warn     | ci-pr   |

---

## Usage

### For Autonomous Agents

Before making changes:

```bash
# Check foundation invariants first (prevents CRLF/EOL surprises)
npm run verify:foundation || exit 1

# Run all error-severity checks
npm run verify
```

After making changes:

```bash
# Re-run all invariants to ensure nothing broke
npm run verify

# If changes touched AI components, also run:
npm run test:ai-schemas
npm run test:ai-golden
```

### For CI Pipelines

Add a dedicated invariants check stage:

```yaml
- name: Foundation Checks (Run First)
  run: |
    test -f .gitattributes
    git ls-files --eol | grep -E 'w/crlf.*\.(sh|py)$' && exit 1 || true

- name: Verify Invariants
  run: |
    npm run verify
    # Or: npm test && npm run lint && npm run typecheck && npm run format:check
```

### For Release Automation

Release workflows should bypass developer hooks:

```yaml
env:
  HUSKY: '0' # Disable husky hooks

- name: Release
  run: npx semantic-release
```

---

## Notes

- **Add new invariants** when you identify rules that should never be violated
- **Keep verification commands deterministic** — avoid relying on external services or network state
- **Error-severity invariants** block merges; **warn-severity invariants** are advisory
- **Update this file** whenever you change tooling that affects verification commands
- **Check foundation invariants first** to catch CRLF/EOL issues before they cause cryptic failures
- **Use one canonical verify command** (`npm run verify`) that all stages call
