# Repository Invariants

Repository invariants are rules that **must always hold true**, regardless of what code is added or changed. Autonomous agents and CI systems use this file to validate repository state before and after changes.

## Format

Each invariant includes:

- **ID**: Unique identifier (e.g., `INV-001`)
- **Title**: Brief description
- **Verification**: Command or check to validate
- **Severity**: `error` (must pass) or `warn` (should pass)

---

## Invariants

| ID      | Title                            | Verification                              | Severity |
| ------- | -------------------------------- | ----------------------------------------- | -------- |
| INV-001 | All tests must pass              | `npm test`                                | error    |
| INV-002 | No uncommitted changes           | `git status --porcelain` (empty output)   | error    |
| INV-003 | Build succeeds                   | `npm run build`                           | error    |
| INV-004 | Linting passes                   | `npm run lint`                            | error    |
| INV-005 | Formatting is consistent         | `npm run format:check`                    | error    |
| INV-006 | Type checking passes             | `npm run typecheck`                       | error    |
| INV-007 | Coverage threshold met           | `npm run test:coverage` (>= 80%)          | warn     |
| INV-008 | No high-severity vulnerabilities | `npm audit --audit-level=high`            | error    |
| INV-009 | Lockfile is up-to-date           | `npm ci` (should succeed without changes) | error    |

---

## Usage

### For Autonomous Agents

Before making changes:

```bash
# Run all error-severity checks
for inv in INV-001 INV-002 INV-003 INV-004 INV-005 INV-006 INV-008 INV-009; do
  echo "Checking $inv..."
  # Execute verification command from table
done
```

After making changes:

```bash
# Re-run all invariants to ensure nothing broke
```

### For CI Pipelines

Add a dedicated invariants check stage:

```yaml
- name: Verify Invariants
  run: |
    npm test
    npm run lint
    npm run typecheck
    npm run format:check
    npm audit --audit-level=high
```

---

## Notes

- **Add new invariants** when you identify rules that should never be violated
- **Keep verification commands deterministic** — avoid relying on external services or network state
- **Error-severity invariants** block merges; **warn-severity invariants** are advisory
- **Update this file** whenever you change tooling that affects verification commands
