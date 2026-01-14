# Agent Safety Guide

This guide explains how to make repositories safe for autonomous coding agents to work in.

## What is "Agent-Safe"?

An **agent-safe repository** provides:

1. **Clear invariants** — Rules that must always hold true
2. **Deterministic verification** — Commands that validate state without ambiguity
3. **Transition gates** — Requirements for moving between project phases
4. **Completion criteria** — Definition of "done" for milestones

These patterns help autonomous agents understand constraints, validate their work, and avoid breaking critical requirements.

---

## The Three Pillars

### 1. Invariants (`INVARIANTS.md`)

**Purpose**: Define rules that must **always** be true.

**When to use**:

- Repository-wide requirements (e.g., "all tests pass")
- Security constraints (e.g., "no secrets in code")
- Quality gates (e.g., "coverage >= 80%")

**Key features**:

- Machine-readable verification commands
- Error/warn severity levels
- Deterministic checks (no external dependencies)

**Example**:

```markdown
| ID      | Title          | Verification | Severity |
| ------- | -------------- | ------------ | -------- |
| INV-001 | All tests pass | `npm test`   | error    |
```

**Template**: [`templates/INVARIANTS.md`](file:///e:/projects/repo-standards/templates/INVARIANTS.md)

---

### 2. Phase Gates (`phase-gates.md`)

**Purpose**: Define requirements to transition between development phases.

**When to use**:

- Multi-phase projects (Planning → Implementation → Verification → Release)
- Approval workflows
- Stage-gated deployments

**Key features**:

- Pre-conditions for each transition
- Approval requirements (human or automated)
- Evidence artifacts required

**Example**:

```markdown
### Implementation → Verification

Pre-condition: Unit tests written (coverage >= 80%)
Approval: Automated (CI) + Human (code review)
Evidence: Green CI build, merged PRs
```

**Template**: [`templates/phase-gates.md`](file:///e:/projects/repo-standards/templates/phase-gates.md)

---

### 3. Victory Gates (`victory-gates.md`)

**Purpose**: Define "done" criteria for major milestones.

**When to use**:

- Release readiness checks
- MVP completion criteria
- Production launch gates

**Key features**:

- All-or-nothing completion (all conditions must pass)
- Evidence requirements
- Status tracking (☐ → ☑)

**Example**:

```markdown
### VG-001: MVP Complete

| Condition      | Verification       | Status |
| -------------- | ------------------ | ------ |
| E2E tests pass | `npm run test:e2e` | ☑      |
```

**Template**: [`templates/victory-gates.md`](file:///e:/projects/repo-standards/templates/victory-gates.md)

---

## How They Work Together

```
┌─────────────────┐
│  INVARIANTS.md  │  ← Always enforced (every commit, every phase)
└─────────────────┘
        │
        ├─── Planning Phase ───────────────────┐
        │    (invariants check before/after)   │
        │                                       │
        v                                       v
   [Phase Gate]                         [Work completed]
        │                                       │
        v                                       v
        ├─── Implementation Phase ─────────────┤
        │    (invariants check before/after)   │
        │                                       │
        v                                       v
   [Phase Gate]                         [All features coded]
        │                                       │
        v                                       v
        ├─── Verification Phase ───────────────┤
        │    (invariants + victory gate)       │
        │                                       │
        v                                       v
   [Victory Gate]                       [MVP COMPLETE ✓]
```

**Key insight**: Invariants apply **continuously**, phase gates control **transitions**, victory gates declare **completion**.

---

## Implementation Recommendations

### For Small Projects

- Start with **INVARIANTS.md only**
- Add 5-10 critical rules (tests, lint, build)
- Skip phase/victory gates unless needed

### For Medium Projects

- **INVARIANTS.md** (comprehensive)
- **phase-gates.md** (Planning → Impl → Verification)
- Victory gates optional

### For Large/Enterprise Projects

- All three patterns
- Multiple victory gates (MVP, Beta, GA)
- Automated enforcement in CI

---

## Best Practices

### 1. Keep Verification Commands Deterministic

✓ **Good**: `npm test` (always same result for same code)  
✗ **Bad**: `curl api.example.com/health` (network dependency)

### 2. Use Canonical Paths

✓ **Good**: `INVARIANTS.md` (one standard location)  
✗ **Bad**: `invariants.md`, `.agent/invariants.md`, `INVARIANTS.md` (ambiguous)

### 3. Make Evidence Non-Negotiable

✓ **Good**: "Green CI build + merged PR + coverage report"  
✗ **Bad**: "Code looks good" (subjective, no proof)

### 4. Start Simple, Add Over Time

- Begin with 3-5 invariants
- Add phase gates when workflow complexity warrants it
- Create victory gates for major milestones only

---

## For Autonomous Agents

When working in an agent-safe repository:

1. **Read INVARIANTS.md first**
   - Understand what must always be true
   - Run verification commands before making changes

2. **Check phase gates** (if they exist)
   - Verify you're in the correct phase
   - Don't skip gates—ask human for approval if needed

3. **Before declaring "done"**
   - Check victory gates (if they exist)
   - Ensure all conditions are met
   - Collect evidence artifacts

---

## For Humans

When setting up agent safety:

1. **Create INVARIANTS.md**
   - List 5-10 critical rules
   - Add verification commands
   - Test all commands manually

2. **Add to CI pipeline**
   - Run all invariant checks in CI
   - Make them blocking (exit code ≠ 0 fails build)

3. **Document phase/victory gates** (optional)
   - Only add if your workflow needs them
   - Keep them simple and enforceable

4. **Review and refine**
   - Update as project evolves
   - Remove gates that don't add value
   - Add new invariants when patterns emerge

---

## See Also

- [Repository Standards](file:///e:/projects/repo-standards/README.md) — Master checklist
- [Templates](file:///e:/projects/repo-standards/templates/) — Starting files for invariants, phase gates, victory gates
