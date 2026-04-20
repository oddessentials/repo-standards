# `p-schema-version-monotonic`

CI gate asserting the `schema_version` seed embedded in the canonical schema source equals `max(target_version)` across the registered migration registry. Catches "added a migration, forgot to bump the seed" — where fresh DBs boot at an older schema version than the latest migration targets.

_Adapted from `oddessentials/ado-git-repo-insights@9d2d2087` (conceptual; no direct reference test in source)._

## Defect class prevented

The schema source declares a version seed that fresh databases write into `schema_version` (or `PRAGMA user_version`) on bootstrap. The migration registry advances that version as migrations run. When the two drift:

- Fresh DBs boot at `seed=6`, but the latest registered migration targets `v7`.
- Fresh DBs bypass the v6→v7 migration because their `user_version` isn't less than 7 after the seed — but the v7 schema hasn't actually been applied.
- Subsequent code paths that depend on v7-only tables / columns raise against fresh DBs; legacy DBs that went through the chain work fine.

The defect is invisible to any test that only exercises the migration path — migrations run correctly end-to-end; fresh-bootstrap is the broken leg.

Three scenarios the gate catches:

1. **Seed lag.** Seed stayed at `v6` while a `v6→v7` migration landed.
2. **Seed overshoot.** Seed was bumped to `v8` without a corresponding `v7→v8` migration.
3. **Empty migration registry with non-zero seed.** Usually a bootstrap bug.

## How the pattern works

Two integer reads, one equality:

1. **Read** `SCHEMA_VERSION_SEED` from the canonical schema module.
2. **Read** `max(m.target_version for m in MIGRATIONS)` from the registry.
3. **Assert** they're equal. Fail with a message that names both values and the direction of drift.

When the registry is empty, the seed MUST be 0 (or whatever your project's "no migrations yet" convention is). Empty registry + non-zero seed is ill-defined.

The check runs at `ci-pr` execution stage.

## Integration

Two hooks:

| Hook                           | Shape                                             | Purpose                            |
| ------------------------------ | ------------------------------------------------- | ---------------------------------- |
| `SCHEMA_VERSION_SEED` constant | `int`                                             | The version fresh DBs boot at      |
| `MIGRATIONS` registry          | `Sequence[Migration]` with `.target_version: int` | The version fresh DBs should reach |

Both MUST be the single authoritative source for their respective values — per [`mp-authoritative-contract-file`](../../../docs/patterns/meta-principles.md#mp-authoritative-contract-file). Do not hardcode the schema version in migrations, tests, or CI workflows; read from the authoritative constants.

## Scope discipline

**This test locks a single equality: `SCHEMA_VERSION_SEED == max(target_version)`.** It must NOT be extended to:

- assert per-migration version gaps (`[2, 3, 5]` vs `[2, 3, 4]` — that's a different invariant, and some projects legitimately skip versions for tombstone reasons),
- assert migration ordering (already implied by the registry's declaration order),
- parse the schema DDL for version literals (use the constant — parsing is drift-prone),
- assert that migrations exist for every version below the seed (covered by [`p-migration-test-coverage`](../p-migration-test-coverage/) and [`p-schema-migration-parity`](../p-schema-migration-parity/)).

Widening the lock to "every number makes sense everywhere" is classic churn bait: the next time a migration is tombstoned, skipped, or renamed, the gate fires for an unrelated reason, consumers bypass it, and the genuine seed-lag defect stops being protected. One number, one check, one remediation path.

(See [`mp-churn-bait-discipline`](../../../docs/patterns/meta-principles.md#mp-churn-bait-discipline).)

## Stack coverage

- **Python (runnable reference):** [`python/`](./python/).
- **TypeScript (concept-only):** [`typescript/`](./typescript/).

## Adversarial tests included

1. `test_detects_seed_lag` (fabricated-regression) — patches the registry to include a migration targeting one version above the current seed; asserts the gate fires and names both values.
2. `test_detects_seed_overshoot` (fabricated-regression) — patches the seed one above `max(target_version)`; asserts the gate fires and names both values.

## Design principles this template obeys

This pattern follows: `mp-adversarial-proof-required`, `mp-authoritative-contract-file`, `mp-churn-bait-discipline` — see [Meta-Principles](../../../docs/patterns/meta-principles.md) for context.
