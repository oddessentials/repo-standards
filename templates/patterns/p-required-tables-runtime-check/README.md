# `p-required-tables-runtime-check`

Two-phase table-presence validation at `DatabaseManager.connect()` time. Before migrations run, validate that every "fundamental" table (present since schema inception) exists — reject the file otherwise. After migrations run, validate that every "required" table exists — reject the connection if any migration silently failed to create a later-added table.

_Adapted from `oddessentials/ado-git-repo-insights@9d2d2087`._

## Defect class prevented

Two distinct defects the two phases catch independently:

- **Foreign or corrupted DB file.** The code is handed a `.db` path that isn't actually this project's database — a leftover from another tool, a partial restore, a file with the right extension but different content. Running migrations against it would mutate the file before surfacing any error. The pre-migration phase rejects the connection with a clear message before any DDL is executed.
- **Silent migration failure.** A migration ran, committed its `PRAGMA user_version` bump, but failed to create the table it claims to create — a bug in the migration body, an unhandled error in a nested `ALTER TABLE`, a timing issue. The post-migration phase catches this at the next code path that depends on the table, rather than letting the defect reach production read paths.

Paired with [`p-schema-migration-parity`](../p-schema-migration-parity/) at the PR-CI surface:

- The parity test catches "added a `CREATE TABLE` to `SCHEMA_SQL` without a migration" on the introducing commit.
- This runtime check catches the same defect at connect time if the PR gate was bypassed, the harness silently disabled the parity test, or the defect was introduced by a manual DB edit rather than a code change.

See [`mp-defense-in-depth`](../../../docs/patterns/meta-principles.md#mp-defense-in-depth) for the general principle.

## How the pattern works

In `connect()`, distinguish new DB vs existing DB:

- **New DB.** Bootstrap from `SCHEMA_SQL` — schema is declared, no validation needed.
- **Existing DB (the interesting case).**
  1. **Phase 1 — fundamental validation.** Assert every table in `FUNDAMENTAL_TABLES` exists. This is the set of tables that have been part of this project's schema since v1. Missing fundamental tables means the file isn't ours — raise a clear error, do NOT run migrations.
  2. **Migration application.** Apply any pending migrations through the registered chain. `PRAGMA user_version` drives which migrations run.
  3. **Phase 2 — required validation.** Assert every table in `REQUIRED_TABLES` exists. This is the full set the running app expects after the migration chain completes. Missing required tables means a migration silently failed — raise.

Order is load-bearing:

- Phase 1 before migrations — so a foreign file fails fast without being mutated.
- Phase 2 after migrations — so a legacy file that legitimately migrates a later-added table in from an earlier version doesn't fail phase 2 prematurely.

Neither phase runs on a brand-new DB that's bootstrapping from `SCHEMA_SQL`. The shape is identical to the bootstrap source, so re-validating it is noise.

## Integration

| Hook                            | Shape                                     | Purpose                                   |
| ------------------------------- | ----------------------------------------- | ----------------------------------------- |
| `FUNDAMENTAL_TABLES` constant   | `frozenset[str]`                          | Phase-1 gate (pre-migration)              |
| `REQUIRED_TABLES` constant      | `frozenset[str]` (⊇ `FUNDAMENTAL_TABLES`) | Phase-2 gate (post-migration)             |
| `DatabaseManager.connect()`     | hosts both validations                    | The runtime surface where the check fires |
| `DatabaseError` (or equivalent) | raised on validation failure              | Signals the defect to callers             |

The constants MUST be declared in a single module — shared with the parity test in [`p-schema-migration-parity`](../p-schema-migration-parity/). Having two copies is the exact drift surface the paired-pattern design exists to reduce.

## Failure semantics

Fail loud, not silent:

- Raise a typed exception (`DatabaseError` or similar) with a message that names the missing table(s) and which phase failed.
- Close the connection before raising so callers don't leak a half-initialized handle.
- Do not attempt recovery, auto-creation, or fallback — the point of the check is to surface the defect, not paper over it.

## Stack coverage

- **Python (runnable reference):** [`python/`](./python/) — full `DatabaseManager` with two-phase validation, typed `DatabaseError`, happy-path tests for both fresh DB and legacy-DB upgrade paths, adversarial tests for both phase failures.
- **TypeScript (concept-only):** [`typescript/`](./typescript/) — pointers for wiring the same check into the DB client lifecycle.

## Adversarial tests included

1. `test_fails_when_fundamental_missing_pre_migration` (fabricated-regression) — creates a DB with a fundamental table missing, connects, asserts the raised error names the missing table and references phase 1. Proves migrations are NOT run against foreign files.
2. `test_fails_when_required_missing_post_migration` (fabricated-regression) — simulates a silently-broken migration by pre-populating the DB with the fundamental tables but omitting a later-required table, then connects without the migration present. Asserts the raised error names the missing table and references phase 2.

## Design principles this template obeys

This pattern follows: `mp-adversarial-proof-required`, `mp-defense-in-depth` — see [Meta-Principles](../../../docs/patterns/meta-principles.md) for context.
