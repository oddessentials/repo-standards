# `p-schema-version-monotonic` — TypeScript adaptation

Concept-only. The check itself is trivial — one integer comparison — but where `SCHEMA_VERSION_SEED` lives and how your registry exposes `target_version` varies by ecosystem.

## Apply the same one-line check

```ts
import { SCHEMA_VERSION_SEED } from "./schema";
import { MIGRATIONS } from "./migrations";

const maxTarget =
  MIGRATIONS.length === 0
    ? 0
    : Math.max(...MIGRATIONS.map((m) => m.targetVersion));

if (SCHEMA_VERSION_SEED !== maxTarget) {
  throw new Error(
    `SCHEMA_VERSION_SEED (${SCHEMA_VERSION_SEED}) != ` +
      `max(targetVersion) (${maxTarget}). ` +
      `Fresh DBs boot at v${SCHEMA_VERSION_SEED}; the registry advances ` +
      `legacy DBs to v${maxTarget}. Bump the seed or add the missing migration.`,
  );
}
```

## Ecosystem pointers

### Drizzle ORM

`drizzle-kit` journals migrations with numeric indices in `drizzle/meta/_journal.json`. Read the journal's highest `idx` and compare to a `SCHEMA_VERSION_SEED` constant you maintain in your schema module — drizzle doesn't expose the seed natively, so it's a small addition.

### Prisma

Prisma's `prisma/migrations/` directory is timestamped, not numeric. The "version seed" concept doesn't map directly — use `prisma migrate status` to check the applied set matches the registered set, then adapt this pattern to Prisma's conventions. The churn-bait-discipline guidance still applies: lock one clear invariant, not "every timestamp makes sense."

### Knex / node-pg-migrate

Expose `LATEST_MIGRATION_VERSION` as a generated constant from your migrations directory (small Node script that scans filenames and picks the max index). Compare to the seed in your schema file.

## Scope discipline applies identically

One number, one check, one remediation path. Do not extend to per-migration gap checks or ordering asserts — those are different invariants and belong in separate tests with their own names.

See the [Python reference](../python/) for the canonical shape.
