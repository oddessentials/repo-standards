# Phase Gates

Phase gates define the requirements for transitioning between development phases. They ensure work is complete and validated before moving forward.

## Format

Each phase gate includes:

- **From Phase** → **To Phase**
- **Pre-conditions**: What must be true before transition
- **Approval**: Human or automated approval requirements
- **Evidence**: Artifacts or checks required

---

## Phase Transitions

### Planning → Implementation

| Pre-condition                | Verification                                 |
| ---------------------------- | -------------------------------------------- |
| Implementation plan approved | Plan document exists with approval timestamp |
| All questions answered       | No open TODO items in plan                   |
| Tech design reviewed         | Design doc tagged with `reviewed`            |

**Approval**: Human (tech lead or product owner)

**Evidence**:

- `implementation_plan.md` with approval comment
- All design documents in `docs/` directory

---

### Implementation → Verification

| Pre-condition              | Verification                            |
| -------------------------- | --------------------------------------- |
| All planned features coded | Git commits reference all planned items |
| Unit tests written         | Test coverage >= 80% on new code        |
| Code reviewed              | All PRs merged to feature branch        |
| Build succeeds             | CI pipeline passes                      |

**Approval**: Automated (CI) + Human (code review)

**Evidence**:

- Green CI build
- Merged pull requests
- Coverage report

---

### Verification → Release

| Pre-condition          | Verification                          |
| ---------------------- | ------------------------------------- |
| Integration tests pass | CI integration test suite green       |
| Manual QA complete     | Sign-off from QA team                 |
| CHANGELOG updated      | New version documented                |
| Release notes written  | `RELEASE_NOTES.md` exists for version |

**Approval**: Human (release manager)

**Evidence**:

- Green CI build (all stages)
- QA sign-off document
- Updated CHANGELOG.md
- Version tag in git

---

## Usage

### For Autonomous Agents

Check if transition is allowed:

```bash
# Example: Can we move from Implementation to Verification?
# 1. Check unit tests exist
# 2. Check coverage threshold
# 3. Verify build passes
# 4. Confirm PRs are merged
```

### For CI Pipelines

Add phase gate checks:

```yaml
- name: Verify Phase Gate
  run: |
    # Check pre-conditions for current phase
    if [ "$PHASE" = "implementation" ]; then
      npm test
      npm run coverage:check
    fi
```

---

## Notes

- **Gates are sequential** — you must pass through each gate in order
- **Approval records** should be timestamped and attributed
- **Failed gates block progression** — fix issues before advancing
- **Evidence artifacts** must be committed or uploaded to artifact storage
