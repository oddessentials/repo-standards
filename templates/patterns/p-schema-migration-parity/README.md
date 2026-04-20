# `p-schema-migration-parity`

Static test asserting every table declared in the canonical schema source is either in a "fundamental" set (present since inception) or created by at least one registered migration. Shifts detection of "added table to schema, forgot the migration" from production runtime to PR CI.

_Adapted from `oddessentials/ado-git-repo-insights@9d2d2087`._

## Defect class prevented

A `CREATE TABLE` added to the canonical schema source without a paired migration ships silently:

- Fresh databases receive the new table because they bootstrap from the canonical schema.
- Legacy databases upgrade through the migration chain, which never mentions the table, and reach the running app missing it.
- The first write path that references the table raises `OperationalError: no such table` in production.

This defect is invisible to every CI leg that only tests against fresh DBs. The parity test is the PR-time gate that forces the invariant into view on the introducing commit.

## How the pattern works

Two enumerations, one subtraction:

1. **Schema tables.** Materialize the canonical `SCHEMA_SQL` in an in-memory SQLite DB and read `sqlite_master` for the real declared set. (Real materialization is more robust than regex/AST scanning — it captures whatever SQLite actually creates regardless of statement form.)
2. **Migration-chain tables.** Seed a temp DB with the oldest-supported `v1` schema, connect through the production `DatabaseManager` so the real upgrade path runs, and read `sqlite_master` again.
3. **Invariant.** `schema_tables ⊆ FUNDAMENTAL_TABLES ∪ migration_chain_tables`. Any difference is a table declared in schema but unreachable through the migration path — fail with a message that names the offending tables and both remediation paths (add a migration, or extend the fundamental set).

The test runs at `ci-pr` execution stage. Pair with [`p-required-tables-runtime-check`](../p-required-tables-runtime-check/) for runtime defense-in-depth — the shift-left gate catches the defect on the introducing PR; the runtime gate catches it on legacy-DB connect if the PR gate was somehow bypassed.

## Integration

Three hooks the test assumes exist in your persistence layer:

| Hook                          | Shape                              | Purpose                                                     |
| ----------------------------- | ---------------------------------- | ----------------------------------------------------------- |
| `SCHEMA_SQL` constant         | `str` of `CREATE TABLE` statements | Canonical declared schema                                   |
| `FUNDAMENTAL_TABLES` constant | `frozenset[str]`                   | Tables present since v1 (exempt from requiring a migration) |
| `DatabaseManager.connect()`   | runs the migration chain           | Exercised by the test to compute chain-created tables       |

The reference under [`python/`](./python/) shows one valid shape. Copy `test_schema_migration_parity.py` into your test suite and replace the `from . import reference_*` lines with imports against your own persistence module.

The test is read-only on the real schema — the red-path test appends a canary DDL to a _copy_ of `SCHEMA_SQL`, never to the module constant.

## Scope discipline

**This test locks table-name presence only.** It must NOT be extended to lock:

- column shapes, counts, or types,
- index presence or ordering,
- constraint bodies,
- row-count or seed-data assertions,
- any prose in surrounding schema documentation.

Use [`p-migration-ddl-parity`](../p-migration-ddl-parity/) for structural byte-equivalence between the canonical schema and the migration chain. Conflating the two surfaces turns this test into churn bait — the next column-rename PR will trip it for unrelated reasons, consumers will learn to bypass it, and the original defect class (missing table) stops being protected.

If you need a broader lock, ship it as a separate test with its own name so reviewers can see which invariant is firing. Do not widen this one.

## Stack coverage

- **Python (runnable reference):** [`python/`](./python/) — full SQLite reference using `pytest`'s `tmp_path` fixture, includes both the happy-path test and the red-path (adversarial) tests.
- **TypeScript (concept-only):** [`typescript/`](./typescript/) — pointers to drizzle-kit / Kysely / node-pg-migrate for the equivalent pattern shape. No runnable skeleton: the parity test is tightly coupled to the migration registry shape, and a generic TS skeleton would either be wrong for most registries or too abstract to adapt faithfully.

## Adversarial tests included

Per [`mp-adversarial-proof-required`](../../../docs/patterns/meta-principles.md#mp-adversarial-proof-required), the reference test file ships two adversarial tests alongside the happy-path test:

1. `test_detects_missing_migration` (fabricated-regression) — appends a canary `CREATE TABLE` to a copy of `SCHEMA_SQL` and asserts the gate names the canary explicitly in its failure message, including both remediation paths.
2. `test_detects_missing_migration_when_chain_empty` (removed-correctness) — simulates a broken migration runner by computing the unmigrated set against an empty chain, and asserts every non-fundamental schema table is flagged. If the migration-chain arm of the allowed set silently became a no-op, this test would catch it.

Both tests reference the happy-path check by name so the linkage is obvious in the file.

## Design principles this template obeys

This pattern follows: `mp-adversarial-proof-required`, `mp-churn-bait-discipline`, `mp-point-in-time-structural-claims` — see [Meta-Principles](../../../docs/patterns/meta-principles.md) for context.
