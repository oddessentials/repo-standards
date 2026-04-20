# `p-migration-test-coverage`

Coverage check asserting that every migration in the registry has at least one test exercising it (a) on a blank DB and (b) on the prior schema version. Blocks untested migrations from shipping.

_Adapted from `oddessentials/ado-git-repo-insights@9d2d2087` (conceptual; derived from the broader test-discipline conventions in source)._

## The migration registry is the authoritative manifest

This is load-bearing for the pattern and governs how the check is implemented:

- **DO** iterate the registry constant (e.g., `from .migrations import MIGRATIONS`) as the source of truth for which migrations exist.
- **DO NOT** file-scan `migrations/` directories, parse filenames, walk `__init__.py` imports, or introspect module contents.

The registry is what the running app actually uses to drive upgrades. A migration that exists as a file but isn't in the registry will never run; a migration in the registry without a corresponding file will fail to import. Either way, the registry is the only set that matters — filename / file-presence checks produce false positives (tombstoned files, tooling scratch files) and false negatives (registered in-memory migrations for tests).

See [`mp-committed-proof-artifacts`](../../../docs/patterns/meta-principles.md#mp-committed-proof-artifacts) — the registry is the artifact; the coverage check is the exact-match verifier.

## Defect class prevented

An engineer adds a migration to the registry, wires it into the production upgrade path, but ships no tests for it:

- **No blank-DB test.** The fresh-install path through that migration has never run. Migration bodies contain real SQL — DROP COLUMN semantics vary between dialects, `ALTER TABLE` has edge cases, transaction boundaries interact with DDL in non-obvious ways. The first production fresh-install exercises the code for real.
- **No prior-version test.** The legacy-upgrade path has never run. The migration may assume a table exists in a shape only fresh DBs have. Legacy tenants start upgrading and the migration raises against a structure it didn't anticipate.

Both tests are required because they exercise materially different code paths — the blank-DB test runs the migration body; the prior-version test runs the migration body _against the schema the prior migration left behind_, which can differ from any engineer's mental model.

## How the pattern works

1. Read the registry constant. This is the authoritative list.
2. For each `Migration(target_version=N, apply=...)`, ask:
   - Does at least one test exist that runs this migration's `apply()` against a **blank DB**?
   - Does at least one test exist that runs this migration's `apply()` against a **DB at schema version N-1**?
3. The two questions are answered by consulting a per-migration coverage manifest maintained alongside the registry. The manifest maps `target_version` → `{blank_db: [test_ids...], prior_version: [test_ids...]}`. Missing or empty arrays fail the gate.

Why a manifest and not "discover tests automatically": test discovery depends on file naming, class hierarchies, parametrize fixtures, and any number of ecosystem-specific conventions — none of which are reliable to introspect across projects. An explicit manifest is diffable in PR, forces the engineer to claim coverage explicitly, and fails the gate if the claim goes stale (missing test id, removed test).

The check runs at `ci-pr` execution stage.

## Integration

| Hook                               | Shape                                                           | Purpose                                          |
| ---------------------------------- | --------------------------------------------------------------- | ------------------------------------------------ |
| `MIGRATIONS` registry              | `Sequence[Migration]` with `.target_version: int`               | Authoritative set of migrations                  |
| `MIGRATION_TEST_COVERAGE` manifest | `Mapping[int, {blank_db: list[str], prior_version: list[str]}]` | Per-target-version claim of which tests cover it |
| Test discovery                     | whatever your test framework uses                               | Manifest entries must match real test ids        |

The manifest lives in the same module as the registry (or imports from it). Adding a migration means adding its manifest entry; the gate fails immediately if coverage claims are missing or empty.

An optional second-level check walks the test suite and verifies every manifest-claimed test actually exists. Shipping this extra check moves the pattern from "claim is diffable" to "claim is exact-match verified" (strongest form of [`mp-committed-proof-artifacts`](../../../docs/patterns/meta-principles.md#mp-committed-proof-artifacts)).

## Stack coverage

- **Python (runnable reference):** [`python/`](./python/) — registry + manifest + coverage check + adversarial tests.
- **TypeScript (concept-only):** [`typescript/`](./typescript/).

## Adversarial tests included

1. `test_detects_untested_migration` (fabricated-regression) — appends a migration to a copy of the registry with no manifest entry; asserts the gate names the missing `target_version` explicitly.
2. `test_detects_partial_test_coverage` (fabricated-regression) — constructs a manifest entry with `blank_db` populated but `prior_version` empty; asserts the gate names both the migration and the missing phase.

## Design principles this template obeys

This pattern follows: `mp-adversarial-proof-required`, `mp-committed-proof-artifacts` — see [Meta-Principles](../../../docs/patterns/meta-principles.md) for context.
