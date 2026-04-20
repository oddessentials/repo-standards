"""Reference DatabaseManager — runs the migration chain on connect.

Minimal shape the parity test relies on. Your project's equivalent can be
richer (connection pooling, retry, telemetry, etc.) as long as
``connect()`` drives the registered migration chain to completion before
returning.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

from .reference_migrations import MIGRATIONS

FUNDAMENTAL_TABLES: frozenset[str] = frozenset({"users"})
"""Tables that have always existed (since v1). Any schema-declared table NOT
in this set must be created by at least one registered migration — the
invariant the parity test enforces.

Add a table here only when it has been present since the project's earliest
supported schema version. For any table introduced after v1, the correct
remediation is a migration, not an extension of this set."""

REQUIRED_TABLES: frozenset[str] = frozenset({"users", "sessions", "audit_log"})
"""Tables the running app expects after the full migration chain completes.
Used by ``p-required-tables-runtime-check`` at connect time; redundant with
the parity test at the PR surface (that's the defense-in-depth design —
see mp-defense-in-depth)."""


class DatabaseManager:
    """Minimal manager — open, run migrations, expose connection."""

    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.connection: sqlite3.Connection | None = None

    def connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        self._apply_migrations(conn)
        self.connection = conn
        return conn

    def close(self) -> None:
        if self.connection is not None:
            self.connection.close()
            self.connection = None

    @staticmethod
    def _current_version(conn: sqlite3.Connection) -> int:
        row = conn.execute("PRAGMA user_version").fetchone()
        return int(row[0]) if row else 0

    def _apply_migrations(self, conn: sqlite3.Connection) -> None:
        current = self._current_version(conn)
        for migration in MIGRATIONS:
            if migration.target_version <= current:
                continue
            migration.apply(conn)
            conn.execute(f"PRAGMA user_version = {migration.target_version}")
        conn.commit()
