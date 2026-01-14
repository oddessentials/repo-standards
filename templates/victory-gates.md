# Victory Gates

Victory gates define the criteria for declaring major milestones or releases complete. They represent "definition of done" for significant deliverables.

## Format

Each victory gate includes:

- **Gate ID**: Unique identifier
- **Milestone**: Name of the completion target
- **Required Conditions**: All must be satisfied
- **Evidence**: Proof that conditions are met

---

## Victory Gates

### VG-001: MVP Complete

**Milestone**: Minimum Viable Product (v1.0.0)

| Condition                        | Verification                        | Status |
| -------------------------------- | ----------------------------------- | ------ |
| All core features implemented    | Feature checklist 100% complete     | ☐      |
| E2E tests pass                   | `npm run test:e2e` succeeds         | ☐      |
| Performance baselines met        | Load test results within targets    | ☐      |
| Security audit clean             | No high/critical vulnerabilities    | ☐      |
| Documentation complete           | README + API docs published         | ☐      |
| Production deployment successful | Service running in prod environment | ☐      |

**Evidence Required**:

- ✓ All feature branch PRs merged
- ✓ CI/CD pipeline green
- ✓ Load test report uploaded
- ✓ Security scan report
- ✓ Documentation site live
- ✓ Production health checks passing

---

### VG-002: Beta Release Ready

**Milestone**: Public Beta (v0.9.0)

| Condition                 | Verification                    | Status |
| ------------------------- | ------------------------------- | ------ |
| Core functionality tested | Integration tests pass          | ☐      |
| Beta testers onboarded    | Test group > 10 users           | ☐      |
| Feedback mechanism ready  | Issue tracker configured        | ☐      |
| Rollback plan documented  | Runbook includes rollback steps | ☐      |
| Monitoring configured     | Alerts set up for key metrics   | ☐      |

**Evidence Required**:

- ✓ Test results report
- ✓ Beta user list
- ✓ GitHub issues enabled
- ✓ `ROLLBACK.md` exists
- ✓ Monitoring dashboard URL

---

### VG-003: Production Stable

**Milestone**: Production Release (v1.0.0)

| Condition                   | Verification                          | Status |
| --------------------------- | ------------------------------------- | ------ |
| No critical bugs in backlog | Jira/GitHub filter for P0/P1 bugs = 0 | ☐      |
| Uptime SLA met              | 99.9% uptime last 30 days             | ☐      |
| Customer feedback positive  | NPS score > 40                        | ☐      |
| Documentation complete      | All public APIs documented            | ☐      |
| Support team trained        | Runbook reviewed by support           | ☐      |
| Compliance requirements met | Legal/security sign-off received      | ☐      |

**Evidence Required**:

- ✓ Bug report
- ✓ Uptime metrics dashboard
- ✓ Customer survey results
- ✓ API documentation URL
- ✓ Support team sign-off
- ✓ Compliance certificates

---

## Usage

### For Autonomous Agents

Determine release readiness:

```bash
# Check all conditions for a specific victory gate
for condition in VG-001-*; do
  echo "Checking $condition..."
  # Run verification command
  # Mark status as ☑ if passed
done
```

### For Project Managers

Track progress:

1. Review victory gate checklist weekly
2. Update status column (☐ → ☑) as conditions are met
3. Collect and archive evidence artifacts
4. Declare victory when all conditions are ☑

---

## Notes

- **All conditions must pass** — partial completion doesn't count
- **Evidence is non-negotiable** — verbal confirmations are not sufficient
- **Victory gates don't expire** — maintain conditions after declaring victory
- **Add new gates** for future milestones as the project evolves
