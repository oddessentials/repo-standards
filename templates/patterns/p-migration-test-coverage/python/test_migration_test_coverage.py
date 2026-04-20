"""Every migration has blank-DB + prior-version tests claimed in the manifest.

Defect class prevented
----------------------
An engineer wires a migration into the registry, ships it, but writes no
tests for it. Two code paths go unverified:

- The migration body running against a blank DB (fresh-install path).
- The migration body running against the prior schema version
  (legacy-upgrade path).

Both paths exercise materially different preconditions; one test covers
neither. This check blocks the merge on missing coverage claims.

Authoritative manifest
----------------------
The migration registry (``MIGRATIONS``) is the authoritative set. The
coverage manifest (``MIGRATION_TEST_COVERAGE``) claims which tests cover
each migration. This check walks the registry and asserts:

1. Every ``target_version`` in the registry has a manifest entry.
2. Every manifest entry has non-empty ``blank_db`` and ``prior_version``
   arrays.
3. No manifest entry references a ``target_version`` that isn't in the
   registry (stale entries).

Do NOT file-scan ``migrations/`` directories or parse filenames. The
registry is the only authoritative source.

(See ``mp-committed-proof-artifacts``.)

Adaptation
----------
Required hooks:

- ``MIGRATIONS: Sequence[Migration]`` with ``.target_version: int``
- ``MIGRATION_TEST_COVERAGE: Mapping[int, {"blank_db": tuple[str, ...],
  "prior_version": tuple[str, ...]}]``

Optionally add a second check that walks the real test suite and verifies
every manifest-claimed test id resolves to an actual test. That upgrades
the claim from "diffable" to "exact-match verified".
"""

from __future__ import annotations

from typing import Any, List, Mapping, Sequence, Tuple

from .reference_migrations import (
    MIGRATION_TEST_COVERAGE,
    MIGRATIONS,
    Migration,
)


def check_migration_test_coverage(
    migrations: Sequence[Migration],
    manifest: Mapping[int, Mapping[str, Tuple[str, ...]]],
) -> Tuple[List[str], str]:
    """Return ``(failures, message)``.

    Empty ``failures`` means every migration has blank + prior-version
    coverage claimed and no stale manifest entries exist.
    """
    registry_versions = {m.target_version for m in migrations}
    failures: List[str] = []
    lines: List[str] = []

    for migration in migrations:
        version = migration.target_version
        entry = manifest.get(version)
        if entry is None:
            failures.append(f"missing:{version}")
            lines.append(
                f"  migration target_version={version} has no MIGRATION_TEST_COVERAGE "
                f"entry — add one claiming blank_db + prior_version test ids"
            )
            continue
        for phase in ("blank_db", "prior_version"):
            phase_tests = entry.get(phase, ())
            if not phase_tests:
                failures.append(f"empty:{version}:{phase}")
                lines.append(
                    f"  migration target_version={version} has empty '{phase}' "
                    f"coverage array — claim at least one test"
                )

    for manifest_version in manifest:
        if manifest_version not in registry_versions:
            failures.append(f"stale:{manifest_version}")
            lines.append(
                f"  manifest entry target_version={manifest_version} does not "
                f"match any registered migration — remove or reconcile"
            )

    if not failures:
        return [], ""

    message = (
        "Migration test coverage check failed:\n"
        + "\n".join(lines)
        + "\nRegistry is the authoritative set — update the manifest so every "
        "registered migration claims non-empty blank_db and prior_version "
        "coverage, and no manifest entry refers to an unregistered version."
    )
    return failures, message


class TestMigrationTestCoverage:
    """Happy path: every registered migration has non-empty coverage claims."""

    def test_every_migration_has_blank_and_prior_coverage(self) -> None:
        failures, message = check_migration_test_coverage(
            MIGRATIONS, MIGRATION_TEST_COVERAGE
        )
        assert not failures, message


class TestMigrationTestCoverageRedPath:
    """Adversarial tests — prove the gate fires for each failure mode.

    Required by ``mp-adversarial-proof-required``.
    """

    def test_detects_untested_migration(self) -> None:
        """Fabricated-regression: append a migration with no manifest entry.
        Gate must name the missing target_version."""
        new_migration = Migration(target_version=99, apply=lambda c: None)
        drifted_registry = MIGRATIONS + (new_migration,)

        failures, message = check_migration_test_coverage(
            drifted_registry, MIGRATION_TEST_COVERAGE
        )

        assert "missing:99" in failures, (
            f"gate failed to detect untested migration — got: {failures}"
        )
        assert "target_version=99" in message, (
            f"gate message must name the missing target_version, got: {message!r}"
        )

    def test_detects_partial_test_coverage(self) -> None:
        """Fabricated-regression: blank_db populated but prior_version empty.
        Gate must name the migration AND the missing phase."""
        partial_manifest: Mapping[int, Mapping[str, Tuple[str, ...]]] = {
            **MIGRATION_TEST_COVERAGE,
            2: {
                "blank_db": ("tests.some_test::test_blank",),
                "prior_version": (),  # missing
            },
        }

        failures, message = check_migration_test_coverage(
            MIGRATIONS, partial_manifest
        )

        assert "empty:2:prior_version" in failures, (
            f"gate failed to detect partial coverage — got: {failures}"
        )
        assert "target_version=2" in message, (
            f"gate message must name the migration, got: {message!r}"
        )
        assert "prior_version" in message, (
            f"gate message must name the missing phase, got: {message!r}"
        )

    def test_detects_stale_manifest_entry(self) -> None:
        """Fabricated-regression: manifest entry for an unregistered version
        (tombstoned migration whose manifest entry was forgotten). Gate
        must flag it so the manifest stays clean."""
        stale_manifest: Mapping[int, Mapping[str, Tuple[str, ...]]] = {
            **MIGRATION_TEST_COVERAGE,
            999: {
                "blank_db": ("tests.stale::test",),
                "prior_version": ("tests.stale::test",),
            },
        }

        failures, message = check_migration_test_coverage(
            MIGRATIONS, stale_manifest
        )

        assert "stale:999" in failures, (
            f"gate failed to detect stale manifest entry — got: {failures}"
        )
        assert "target_version=999" in message, (
            f"gate message must name the stale version, got: {message!r}"
        )
