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
