"""Ordered migration registry + per-migration test coverage manifest.

The registry is the authoritative set. The manifest makes each migration's
test coverage claim explicit and diffable in PR. The coverage check in
``test_migration_test_coverage.py`` walks the registry and asserts every
``target_version`` has populated ``blank_db`` AND ``prior_version`` arrays.
"""

from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from typing import Callable, Mapping, Tuple


@dataclass(frozen=True)
class Migration:
    target_version: int
    apply: Callable[[sqlite3.Connection], None]


def _migrate_v1_to_v2(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            expires_at TEXT NOT NULL
        );
        """
    )


def _migrate_v2_to_v3(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY,
            actor_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            occurred_at TEXT NOT NULL
        );
        """
    )


MIGRATIONS: Tuple[Migration, ...] = (
    Migration(target_version=2, apply=_migrate_v1_to_v2),
    Migration(target_version=3, apply=_migrate_v2_to_v3),
)


MIGRATION_TEST_COVERAGE: Mapping[int, Mapping[str, Tuple[str, ...]]] = {
    2: {
        "blank_db": (
            "tests.migrations.test_v1_to_v2::TestMigrateV1ToV2::test_blank_db",
        ),
        "prior_version": (
            "tests.migrations.test_v1_to_v2::TestMigrateV1ToV2::test_from_v1",
        ),
    },
    3: {
        "blank_db": (
            "tests.migrations.test_v2_to_v3::TestMigrateV2ToV3::test_blank_db",
        ),
        "prior_version": (
            "tests.migrations.test_v2_to_v3::TestMigrateV2ToV3::test_from_v2",
        ),
    },
}
"""Per-migration test coverage manifest.

Keys: ``target_version`` (must match a Migration in MIGRATIONS).
Values: {``blank_db``: tuple of test ids, ``prior_version``: tuple of test ids}.

Each array MUST be non-empty. Adding a migration means adding its entry.
The check in :func:`check_migration_test_coverage` fails loudly if a
migration has no manifest entry, has empty arrays, or if a manifest entry
references a target_version that doesn't exist in MIGRATIONS."""
