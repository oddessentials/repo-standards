"""Schema version seed equals max(migration target_version).

Defect class prevented
----------------------
Fresh DBs boot at ``SCHEMA_VERSION_SEED`` and then the migration runner
advances their ``user_version`` only for migrations whose
``target_version`` exceeds the current version. If the seed lags the
latest migration, fresh DBs never execute the missing step — they're
stuck at an earlier schema than legacy DBs that actually went through
the chain.

This test asserts a single equality: ``SCHEMA_VERSION_SEED ==
max(m.target_version for m in MIGRATIONS)``.

Scope discipline
----------------
This test locks a **single equality**. It must NOT be extended to assert
per-migration version gaps, migration ordering, DDL-embedded version
literals, or migration existence per version below the seed.

Widening to "every number makes sense everywhere" is classic churn bait:
the next tombstone / skip / rename fires the gate for an unrelated
reason, consumers bypass it, and the genuine seed-lag defect stops being
protected.

(See ``mp-churn-bait-discipline``.)

Adaptation
----------
Required hooks:

- ``SCHEMA_VERSION_SEED: int`` — the version fresh DBs boot at
- ``MIGRATIONS: Sequence[Migration]`` with ``.target_version: int``
"""

from __future__ import annotations

from typing import Tuple

from . import reference_schema
from .reference_migrations import MIGRATIONS, Migration


def _max_target_version(migrations: Tuple[Migration, ...]) -> int:
    if not migrations:
        return 0
    return max(m.target_version for m in migrations)


def _check_seed_matches_chain(
    seed: int, migrations: Tuple[Migration, ...]
) -> Tuple[bool, str]:
    """Return ``(ok, message)``. Single source of truth for the wording
    so happy-path and red-path tests cannot drift."""
    max_target = _max_target_version(migrations)
    if seed == max_target:
        return True, ""

    direction = "lags" if seed < max_target else "overshoots"
    message = (
        f"SCHEMA_VERSION_SEED ({seed}) {direction} max(target_version) "
        f"({max_target}). Fresh DBs boot at v{seed}; the migration registry "
        f"advances legacy DBs to v{max_target}. "
        f"Remediation: {'bump the seed to match the latest migration' if direction == 'lags' else 'add the missing migration(s) to cover the seed'}, "
        f"so fresh and migrated DBs converge."
    )
    return False, message


class TestSchemaVersionMonotonic:
    """Happy path: seed equals max(target_version) in the real registry."""

    def test_seed_matches_max_target_version(self) -> None:
        ok, message = _check_seed_matches_chain(
            reference_schema.SCHEMA_VERSION_SEED, MIGRATIONS
        )
        assert ok, message


class TestSchemaVersionMonotonicRedPath:
    """Adversarial tests — prove the gate fires in both drift directions."""

    def test_detects_seed_lag(self) -> None:
        """Fabricated-regression: append a migration one above the current
        seed without bumping the seed. Gate must fire and name both values.
        """
        seed = reference_schema.SCHEMA_VERSION_SEED
        forward_migration = Migration(
            target_version=seed + 1, apply=lambda conn: None
        )
        drifted_registry = MIGRATIONS + (forward_migration,)

        ok, message = _check_seed_matches_chain(seed, drifted_registry)

        assert not ok, (
            f"gate failed to detect seed lag — expected failure with "
            f"seed={seed}, max={seed + 1}"
        )
        assert f"({seed})" in message, (
            f"gate message must name the seed value, got: {message!r}"
        )
        assert f"({seed + 1})" in message, (
            f"gate message must name the max target_version, got: {message!r}"
        )
        assert "lags" in message, (
            f"gate message must identify the drift direction, got: {message!r}"
        )

    def test_detects_seed_overshoot(self) -> None:
        """Fabricated-regression: bump the seed one above the registry's
        max without adding a migration. Gate must fire and name both values.
        """
        seed = reference_schema.SCHEMA_VERSION_SEED
        drifted_seed = seed + 5  # arbitrary overshoot

        ok, message = _check_seed_matches_chain(drifted_seed, MIGRATIONS)

        assert not ok, (
            f"gate failed to detect seed overshoot — seed={drifted_seed}, "
            f"max={seed}"
        )
        assert f"({drifted_seed})" in message, (
            f"gate message must name the drifted seed, got: {message!r}"
        )
        assert f"({seed})" in message, (
            f"gate message must name the max target_version, got: {message!r}"
        )
        assert "overshoots" in message, (
            f"gate message must identify the drift direction, got: {message!r}"
        )

    def test_empty_registry_with_nonzero_seed_detects_mismatch(self) -> None:
        """Removed-correctness: an empty registry reduces max() to 0, so
        any non-zero seed fires. Confirms the max() computation is the
        load-bearing arm — removing it (by emptying the registry) shifts
        the comparison's "allowed" value to zero and exposes drift.
        """
        ok, message = _check_seed_matches_chain(
            reference_schema.SCHEMA_VERSION_SEED, ()
        )
        assert not ok, "seed != 0 against empty registry should fire"
        assert "(0)" in message, (
            f"gate message must name max=0 for empty registry, got: {message!r}"
        )
