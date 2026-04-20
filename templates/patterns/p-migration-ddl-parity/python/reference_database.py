"""Reference DatabaseManager — runs the migration chain on connect."""

from __future__ import annotations

import sqlite3
from pathlib import Path

from .reference_migrations import MIGRATIONS

FUNDAMENTAL_TABLES: frozenset[str] = frozenset({"users"})
REQUIRED_TABLES: frozenset[str] = frozenset({"users", "sessions", "audit_log"})


class DatabaseManager:
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
