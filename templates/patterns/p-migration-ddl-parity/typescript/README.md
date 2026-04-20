# `p-migration-ddl-parity` — TypeScript adaptation

Concept-only. DDL-parity checks are tightly coupled to both your ORM's introspection surface and your DB vendor's dialect — a generic TS skeleton cannot be honest about either.

## Apply the same three-step check

1. **Fresh-schema snapshot.** Build an in-memory DB from your canonical schema source (drizzle schema objects, Prisma schema, raw SQL) and introspect its structural shape.
2. **Migrated-chain snapshot.** Seed a temp DB with your oldest-supported version, run every registered migration through your migration runner, and introspect the resulting shape.
3. **Structural diff.** Compare tables → columns → indexes. Normalize column order (cosmetic) and keep index column order (semantic). Report per-table divergence by name, not raw DDL.

## Ecosystem pointers

### SQLite via `better-sqlite3`

Use the same `PRAGMA table_info` / `PRAGMA index_list` / `PRAGMA index_info` queries as the Python reference. Port directly:

```ts
const columns = db.prepare(`PRAGMA table_info(${table})`).all();
const indexes = db
  .prepare(`PRAGMA index_list(${table})`)
  .all()
  .filter((i: { origin: string }) => i.origin === "c");
```

### Postgres via [`pg-mem`](https://github.com/oguimbal/pg-mem)

In-memory Postgres supports enough dialect to materialize most schemas. Introspect via `information_schema.columns`, `pg_indexes`, `pg_constraint`. Normalize column order (`ordinal_position` is cosmetic here too) and keep index column order.

### Drizzle ORM

`drizzle-kit` can generate a snapshot JSON (`drizzle-kit generate --dialect <d>`). Running it against both the schema and the migration-applied DB gives two snapshots that diff cleanly. Prefer this over direct DB introspection when you already use drizzle — the snapshot format is stable across drizzle versions.

### Prisma

Use `prisma migrate diff --from-schema-datamodel=... --to-schema-datamodel=...` with the migrated DB URL. Empty diff == parity; non-empty == drift.

## Scope discipline applies identically

The TS version MUST NOT be extended to raw DDL text comparison. Whatever format your ecosystem uses (drizzle snapshot JSON, Prisma migration diff, raw SQL strings), treat the introspected STRUCTURE as the lock surface, not the SERIALIZED FORM. The churn-bait failure mode is identical across languages.

See the [Python reference](../python/) for the canonical shape.
