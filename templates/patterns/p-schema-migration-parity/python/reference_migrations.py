"""Ordered migration registry.

Each :class:`Migration` carries ``target_version`` — the schema_version it
upgrades the DB to — and ``apply(connection)`` which performs the DDL. The
parity test does not call these directly; it drives the migration chain
through :class:`DatabaseManager` so the real production upgrade path is
exercised (ordering, pre-validation, post-validation).
"""

from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from typing import Callable, Tuple


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
"""The authoritative migration registry. The migration-test-coverage pattern
walks this tuple to verify every entry has a corresponding test; the
schema-version-monotonic pattern compares ``max(target_version)`` here
against ``SCHEMA_VERSION_SEED`` in :mod:`reference_schema`."""
