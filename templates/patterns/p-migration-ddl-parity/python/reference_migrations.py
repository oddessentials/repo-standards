"""Ordered migration registry. Must produce a DB structurally equivalent
to SCHEMA_SQL when applied against a v1 seed — that's the invariant this
template's parity test enforces.
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
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
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
        CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON audit_log(actor_id);
        """
    )


MIGRATIONS: Tuple[Migration, ...] = (
    Migration(target_version=2, apply=_migrate_v1_to_v2),
    Migration(target_version=3, apply=_migrate_v2_to_v3),
)
