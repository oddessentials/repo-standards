# `p-migration-test-coverage` — TypeScript adaptation

Concept-only. The coverage-claim manifest is declarative JSON/TS, so the port is straightforward — but the test-id format varies by framework (Vitest, Jest, node:test) and the "prior version" semantics depend on how your migration runner exposes upgrade-from-specific-version.

## The registry is still the authoritative manifest

Same core discipline as the Python reference:

- **DO** iterate your migration registry as the source of truth.
- **DO NOT** file-scan `drizzle/`, `prisma/migrations/`, or `migrations/` directories. Runtime behavior depends on what the registry binds, not what happens to be on disk.

## Apply the same three-checks-per-migration rule

```ts
for (const migration of MIGRATIONS) {
  const entry = MIGRATION_TEST_COVERAGE[migration.targetVersion];
  // 1. entry exists
  // 2. entry.blankDb.length > 0
  // 3. entry.priorVersion.length > 0
}
// 4. no manifest entry references a targetVersion not in MIGRATIONS
```

## Ecosystem pointers

### Vitest / Jest

Test ids are typically `<file path>::<describe>::<it>` — the shape your manifest commits to. Add a second verifier that resolves every claimed id against `vitest list` / `jest --listTests` output to upgrade "diffable" to "exact-match verified."

### Drizzle

Drizzle migrations are timestamped SQL files with no explicit registry. The coverage manifest instead keys on `idx` from `drizzle/meta/_journal.json` — those indices are the registry surface your app actually applies.

### Prisma

Prisma migrations live in `prisma/migrations/<timestamp>_<name>/`. The coverage manifest keys on migration directory name. Apply the same "claim both blank and prior-version tests" rule.

## Optional exact-match verifier

The strongest form of this pattern ([`mp-committed-proof-artifacts`](../../../../docs/patterns/meta-principles.md#mp-committed-proof-artifacts)) walks the manifest AND the real test suite and asserts every claimed id resolves to an actual test. Stale claims fail the gate just like missing claims. Worth shipping once the base pattern is stable.

See the [Python reference](../python/) for the canonical shape.
