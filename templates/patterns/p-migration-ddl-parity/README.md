# `p-migration-ddl-parity`

Structural-equivalence test asserting that a DB built fresh from the canonical schema source has the same tables, columns, constraints, and indexes as a DB built by running every registered migration against the oldest-supported seed. Catches semantic drift between the inline schema and the incremental migration chain.

_Adapted from `oddessentials/ado-git-repo-insights@9d2d2087` (conceptual; no direct reference test in source)._

## Defect class prevented

`SCHEMA_SQL` and the migration chain are two independent expressions of the same intent. They drift silently:

- A column was added to `SCHEMA_SQL` with `NOT NULL` and a default value, but the migration that introduces it omits the constraint. Fresh databases reject null writes; legacy databases accept them. Production writes from the same code succeed against some tenants and fail against others.
- An index was added to `SCHEMA_SQL` for query-plan reasons. The migration didn't create it. Fresh DBs have the index; legacy DBs scan. Performance regressions appear only on legacy tenants.
- A foreign key was added to `SCHEMA_SQL`. The migration `ALTER`s the table but SQLite's limited `ALTER` support means the FK was silently dropped. Fresh DBs enforce; legacy DBs don't.

[`p-schema-migration-parity`](../p-schema-migration-parity/) catches missing _tables_. This pattern catches drift _within_ a table.

## How the pattern works

Two materializations, one structural diff:

1. **Fresh-schema snapshot.** Materialize `SCHEMA_SQL` in an in-memory SQLite DB. Walk every table and capture per-table PRAGMA output: `table_info` (columns), `index_list` + `index_info` (indexes). Normalize so the snapshot is order-insensitive where order is cosmetic (column declaration order) and order-sensitive where order is meaningful (column order within a composite index).
2. **Migrated-chain snapshot.** Seed a temp DB with the v1 schema, run the production `DatabaseManager.connect()` so the real migration chain applies, then snapshot the same way.
3. **Diff.** Same tables, same columns per table (by name → type/null/default/pk tuple), same indexes per table (by name → unique/partial/columns tuple). Any divergence is a drift; fail with a per-table breakdown of what differs and in which direction.

The test runs at `ci-pr` execution stage. Pair with [`p-schema-migration-parity`](../p-schema-migration-parity/) — the pair covers both table-presence and within-table structural drift.

## Integration

Three hooks the test assumes (identical to [`p-schema-migration-parity`](../p-schema-migration-parity/)):

| Hook                        | Shape                                               | Purpose                      |
| --------------------------- | --------------------------------------------------- | ---------------------------- |
| `SCHEMA_SQL` constant       | `str` of `CREATE TABLE` / `CREATE INDEX` statements | Canonical declared schema    |
| `V1_SCHEMA_SQL` constant    | `str` of the oldest-supported schema                | Migration seed               |
| `DatabaseManager.connect()` | runs migration chain                                | Builds the migrated snapshot |

See [`python/`](./python/) for the runnable reference. Copy `test_migration_ddl_parity.py` into your test suite and re-point the `from . import reference_*` imports at your own persistence module.

## Scope discipline

**This test locks PRAGMA-level structural equivalence — not raw DDL text.** It must NOT be extended to:

- compare raw `CREATE TABLE` / `CREATE INDEX` strings,
- diff whitespace or comment layout,
- assert column declaration order (that's cosmetic — SQLite preserves it but rebuilding the table via `ALTER` can change it without semantic impact),
- assert auto-generated internal index names (`sqlite_autoindex_*`).

Raw DDL comparison is classic churn bait: semantically-equivalent statements render as different text under different tools (fresh CREATE vs. `ALTER TABLE ... ADD COLUMN` re-creates), the test fails on unrelated whitespace churn, consumers bypass it, and the real defect class (semantic drift) stops being protected. Keep the lock on structural PRAGMA output so unrelated formatting cannot trip it.

If you need to lock raw DDL text for a specific reason (e.g., vendor-emitted SQL that must be byte-identical for a specific tool), ship it as a separate test with its own name. Do not widen this one.

## Stack coverage

- **Python (runnable reference):** [`python/`](./python/) — SQLite `PRAGMA table_info` / `PRAGMA index_list` / `PRAGMA index_info` with a normalized snapshot function. Both happy-path and red-path tests included.
- **TypeScript (concept-only):** [`typescript/`](./typescript/) — pointers for adapting via `better-sqlite3` (SQLite) or `pg-mem` (Postgres) introspection.

## Adversarial tests included

1. `test_detects_schema_drift` (fabricated-regression) — constructs a drifted copy of `SCHEMA_SQL` with a `NOT NULL` constraint stripped and asserts the gate reports the column difference by table + column name.
2. `test_detects_missing_index` (fabricated-regression) — appends a `CREATE INDEX` to a copy of `SCHEMA_SQL` and asserts the gate names the missing index in the failure message.

## Design principles this template obeys

This pattern follows: `mp-adversarial-proof-required`, `mp-churn-bait-discipline`, `mp-point-in-time-structural-claims` — see [Meta-Principles](../../../docs/patterns/meta-principles.md) for context.
