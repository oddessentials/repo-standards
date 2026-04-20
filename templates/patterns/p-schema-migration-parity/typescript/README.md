# `p-schema-migration-parity` — TypeScript adaptation

Concept-only. The persistence parity patterns are tightly coupled to (a) your canonical schema source, (b) the shape of your migration registry, and (c) the DB access layer's connect-time lifecycle hook. A generic TS skeleton would either be wrong for most registries or too abstract to adapt faithfully — so this template ships pointers instead of code.

## Apply the same three-step check

1. **Enumerate declared tables** — introspect your schema source. For `drizzle-orm`, walk the exported schema object (`Object.values(schema)` filtered to `Table` instances) and read `.name`. For plain SQL, materialize the DDL in an in-memory `better-sqlite3` (for SQLite) or `pg-mem` (for Postgres) and query `sqlite_master` / `information_schema.tables`.
2. **Enumerate migration-chain tables** — seed a temp DB with your oldest-supported version, run every registered migration through the normal migration runner (drizzle-kit, node-pg-migrate, Kysely migrator), then introspect the resulting DB.
3. **Assert** `schema_tables ⊆ fundamental_tables ∪ migration_chain_tables` — same invariant as the Python reference.

## Ecosystem pointers

| Tool                                                                                       | Where the hooks live                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`drizzle-kit`](https://orm.drizzle.team/kit-docs/overview)                                | Schema source: `src/db/schema.ts` exports. Migration registry: `drizzle/` directory of generated SQL files + `__drizzle_migrations` journal.                |
| [`Kysely`](https://kysely.dev/) + [`kysely-ctl`](https://github.com/kysely-org/kysely-ctl) | Schema source: your `Database` interface + one-off `createTable` calls in an init module. Migration registry: `Migrator` with `provideMigrationProvider()`. |
| [`node-pg-migrate`](https://salsita.github.io/node-pg-migrate/)                            | Schema source: conventional `schema.sql` or generated dump. Migration registry: `migrations/` timestamped JS files.                                         |
| [`Prisma`](https://www.prisma.io/)                                                         | Schema source: `schema.prisma`. Migration registry: `prisma/migrations/` directory. Introspection via `prisma migrate diff`.                                |

## Practical notes for TS adaptations

- Prefer [`vitest`](https://vitest.dev/)'s `expect.objectContaining`-style assertions over hand-rolled set diffs — the failure message is more readable.
- If your migration runner is async, remember to await it in the test harness before introspecting the resulting DB.
- For Postgres projects, use [`pg-mem`](https://github.com/oguimbal/pg-mem) for the in-memory materialization step — it supports enough of the Postgres dialect to cover most schema DDL.
- Keep the v1 seed as a single exported constant and import it in every test that walks the migration chain. Copying the seed into multiple tests is the exact drift surface this pattern exists to reduce.

## Scope discipline applies identically

The TS version MUST NOT be extended to lock column shapes, constraint bodies, or index presence. Pair with `p-migration-ddl-parity` for structural byte-equivalence if you need that coverage. The churn-bait failure mode is language-agnostic.

See the [Python reference](../python/) for the canonical shape.
