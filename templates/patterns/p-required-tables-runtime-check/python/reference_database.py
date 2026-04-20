"""Reference DatabaseManager with two-phase runtime table-presence check.

The connect() method distinguishes new-DB bootstrap from existing-DB
upgrade and runs FUNDAMENTAL_TABLES validation pre-migration,
REQUIRED_TABLES validation post-migration.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Iterable, Tuple

from .reference_migrations import MIGRATIONS
from .reference_schema import SCHEMA_SQL


FUNDAMENTAL_TABLES: frozenset[str] = frozenset({"users"})
"""Tables present since v1. Missing fundamental tables in an existing DB file
means the file isn't ours — raise before running any migration."""

REQUIRED_TABLES: frozenset[str] = frozenset({"users", "sessions", "audit_log"})
"""Tables the running app expects after all migrations have applied. Missing
required tables post-migration means a migration silently failed — raise."""


class DatabaseError(Exception):
    """Raised when the runtime table-presence check fails."""


class DatabaseManager:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self._connection: sqlite3.Connection | None = None

    @property
    def connection(self) -> sqlite3.Connection:
        if self._connection is None:
            raise DatabaseError("not connected — call connect() first")
        return self._connection

    def connect(self) -> None:
        is_new_db = not self.db_path.exists()
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            self._connection = sqlite3.connect(str(self.db_path))
            self._connection.row_factory = sqlite3.Row
            self._connection.execute("PRAGMA foreign_keys = ON")

            if is_new_db:
                # New DB: bootstrap from SCHEMA_SQL. Re-validating against the
                # bootstrap source is noise.
                self._connection.executescript(SCHEMA_SQL)
                return

            # Existing DB: two-phase validation around the migration chain.
            #
            #   Phase 1 (pre-migration, fundamental-only): reject foreign or
            #   catastrophically-damaged files BEFORE running migrations. A
            #   missing fundamental table means the file isn't ours;
            #   migrations against it would mutate a bad file.
            #
            #   Phase 2 (post-migration, full required set): catch silent
            #   migration failures. Order matters — we can't require the
            #   full set pre-migration because legacy files are allowed to
            #   be missing later-added tables until migrations supply them.
            self._validate_tables_present(FUNDAMENTAL_TABLES, phase="pre-migration")
            self._apply_migrations()
            self._validate_tables_present(REQUIRED_TABLES, phase="post-migration")
        except (sqlite3.Error, DatabaseError):
            self.close()
            raise

    def close(self) -> None:
        if self._connection is not None:
            self._connection.close()
            self._connection = None

    def _validate_tables_present(
        self, required: frozenset[str], *, phase: str
    ) -> None:
        cursor = self.connection.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        )
        present = frozenset(row[0] for row in cursor.fetchall())
        missing = required - present
        if missing:
            raise DatabaseError(
                f"{phase} table validation failed: missing {sorted(missing)}. "
                f"Required set for this phase: {sorted(required)}. "
                f"Expected tables not found — the database file may be "
                f"foreign, partially migrated, or a migration silently "
                f"failed to create the required table(s)."
            )

    @staticmethod
    def _current_version(conn: sqlite3.Connection) -> int:
        row = conn.execute("PRAGMA user_version").fetchone()
        return int(row[0]) if row else 0

    def _apply_migrations(self) -> None:
        conn = self.connection
        current = self._current_version(conn)
        for migration in MIGRATIONS:
            if migration.target_version <= current:
                continue
            migration.apply(conn)
            conn.execute(f"PRAGMA user_version = {migration.target_version}")
        conn.commit()
