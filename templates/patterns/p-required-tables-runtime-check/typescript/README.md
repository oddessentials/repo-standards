# `p-required-tables-runtime-check` — TypeScript adaptation

Concept-only. The lifecycle hook (where you intercept DB connect) varies by client library — a generic TS skeleton would assume a shape that doesn't match most real projects.

## Where to wire the check

The check goes in the code path that opens a database handle. Two phases, ordered:

```ts
async function connectDatabase(path: string): Promise<Database> {
  const isNewDb = !(await fileExists(path));
  const db = await openConnection(path);

  if (isNewDb) {
    await bootstrapFromSchemaSql(db);
    return db;
  }

  await validateTablesPresent(db, FUNDAMENTAL_TABLES, "pre-migration");
  await runMigrations(db);
  await validateTablesPresent(db, REQUIRED_TABLES, "post-migration");
  return db;
}
```

Ordering is load-bearing: phase 1 before migrations so foreign files aren't mutated; phase 2 after migrations so legacy files get a chance to migrate later-added tables in.

## Ecosystem pointers

### SQLite via `better-sqlite3`

Introspect presence via `SELECT name FROM sqlite_master WHERE type='table'`. Close the connection on error before throwing so callers don't get a half-initialized handle.

### Postgres via `pg` / `postgres.js`

Introspect via `information_schema.tables` filtered to the target schema. The same two-phase structure applies — run your migration runner between the two checks.

### Knex / TypeORM / Drizzle

Most ORMs expose a raw connection for introspection (`knex.raw`, `dataSource.query`, `db.run`). Prefer the raw path for the check — going through the ORM's query builder adds drift surface (the builder might transform table names, apply schema prefixes, etc.) that defeats the "is this file really ours" test.

## Failure semantics

Fail loud:

- Throw a typed error (`DatabaseError`, `ValidationError`) with a message that names the missing tables and which phase failed.
- Close the connection before throwing so callers don't leak a half-initialized handle.
- Do not attempt recovery or auto-creation — the point is to surface the defect.

## Pairing with shift-left

See [`p-schema-migration-parity`](../../p-schema-migration-parity/typescript/) for the PR-CI-surface companion. The pair covers the same defect class at both the introducing-commit surface and the connect-time surface — see [`mp-defense-in-depth`](../../../../docs/patterns/meta-principles.md#mp-defense-in-depth).

See the [Python reference](../python/) for the canonical shape.
