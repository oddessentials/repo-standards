"""Runtime two-phase table-presence check around the migration chain.

Defect class prevented
----------------------
Two distinct defects the phases catch independently:

- **Foreign DB file.** Code hands a ``.db`` path that isn't this project's
  database. Phase 1 rejects before any migration mutates the file.
- **Silently broken migration.** A migration bumps ``user_version`` but
  fails to create the table it claims to create. Phase 2 catches it
  before read paths in production reference the missing table.

Pairs with ``p-schema-migration-parity`` at the PR-CI surface
(see ``mp-defense-in-depth``).

Adaptation
----------
Copy this file into your test suite. Required hooks:

- ``FUNDAMENTAL_TABLES: frozenset[str]`` — phase-1 gate
- ``REQUIRED_TABLES: frozenset[str]`` — phase-2 gate (⊇ fundamental)
- ``DatabaseManager.connect()`` — hosts both validations
- ``DatabaseError`` (or equivalent) — raised on validation failure
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest

from .reference_database import (
    DatabaseError,
    DatabaseManager,
    FUNDAMENTAL_TABLES,
    REQUIRED_TABLES,
)
from .reference_schema import V1_SCHEMA_SQL


class TestRuntimeCheckHappyPath:
    """Both fresh DB and legacy-DB-upgrade paths connect without error."""

    def test_fresh_database_bootstraps_without_validation(
        self, tmp_path: Path
    ) -> None:
        """Fresh DBs re-validating against their own bootstrap source is
        noise — ensure the check is skipped on is_new_db.
        """
        manager = DatabaseManager(tmp_path / "fresh.db")
        manager.connect()
        try:
            present = _present_tables(manager.connection)
            assert REQUIRED_TABLES <= present, (
                f"fresh DB should have all required tables after bootstrap, "
                f"missing: {sorted(REQUIRED_TABLES - present)}"
            )
        finally:
            manager.close()

    def test_legacy_v1_db_upgrades_and_passes_both_phases(
        self, tmp_path: Path
    ) -> None:
        """A v1-seeded file should pass phase 1 (fundamental present),
        run migrations, and pass phase 2 (required present)."""
        db_path = tmp_path / "legacy.db"
        seed = sqlite3.connect(str(db_path))
        try:
            seed.executescript(V1_SCHEMA_SQL)
        finally:
            seed.close()

        manager = DatabaseManager(db_path)
        manager.connect()
        try:
            present = _present_tables(manager.connection)
            assert REQUIRED_TABLES <= present, (
                f"legacy DB should have all required tables post-migration, "
                f"missing: {sorted(REQUIRED_TABLES - present)}"
            )
        finally:
            manager.close()


class TestRuntimeCheckRedPath:
    """Adversarial tests — prove each phase fires on the regression case."""

    def test_fails_when_fundamental_missing_pre_migration(
        self, tmp_path: Path
    ) -> None:
        """Fabricated-regression: hand the manager a DB file that is missing
        a fundamental table. Phase 1 must reject before migrations run.
        """
        foreign_db = tmp_path / "foreign.db"
        conn = sqlite3.connect(str(foreign_db))
        try:
            # A file that exists but lacks the fundamental `users` table.
            # Populated with an arbitrary unrelated table so it's non-empty.
            conn.executescript("CREATE TABLE unrelated (x INTEGER);")
        finally:
            conn.close()

        manager = DatabaseManager(foreign_db)
        with pytest.raises(DatabaseError) as excinfo:
            manager.connect()

        message = str(excinfo.value)
        assert "pre-migration" in message, (
            f"error must name the phase that failed, got: {message!r}"
        )
        assert "users" in message, (
            f"error must name the missing fundamental table, got: {message!r}"
        )
        # Confirm migrations did NOT run — `user_version` should still be 0.
        check = sqlite3.connect(str(foreign_db))
        try:
            row = check.execute("PRAGMA user_version").fetchone()
            assert row[0] == 0, (
                f"phase-1 failure must reject BEFORE migrations run, but "
                f"user_version={row[0]} indicates a migration ran"
            )
        finally:
            check.close()

    def test_fails_when_required_missing_post_migration(
        self, tmp_path: Path
    ) -> None:
        """Fabricated-regression: construct a legacy DB with fundamental
        tables present and ``user_version`` already at the latest so the
        migration chain skips application, but a later-added required
        table is missing. Phase 2 must detect this and raise.

        This simulates a migration that bumped ``user_version`` but
        silently failed to create its required table — exactly the
        regression the post-migration phase exists to catch.
        """
        latest_target = max(m.target_version for m in _migrations())
        stale_db = tmp_path / "stale.db"
        conn = sqlite3.connect(str(stale_db))
        try:
            conn.executescript(V1_SCHEMA_SQL)
            # Pretend migrations up through the latest ran — but sessions /
            # audit_log were silently NOT created.
            conn.execute(f"PRAGMA user_version = {latest_target}")
            conn.commit()
        finally:
            conn.close()

        manager = DatabaseManager(stale_db)
        with pytest.raises(DatabaseError) as excinfo:
            manager.connect()

        message = str(excinfo.value)
        assert "post-migration" in message, (
            f"error must name the phase that failed, got: {message!r}"
        )
        missing_set = REQUIRED_TABLES - FUNDAMENTAL_TABLES
        missing_named = [t for t in missing_set if t in message]
        assert missing_named, (
            f"error must name at least one missing post-migration table "
            f"(expected one of {sorted(missing_set)}), got: {message!r}"
        )


def _migrations():
    """Import here to avoid leaking private names at module scope."""
    from .reference_migrations import MIGRATIONS

    return MIGRATIONS


def _present_tables(conn: sqlite3.Connection) -> frozenset[str]:
    cursor = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    )
    return frozenset(row[0] for row in cursor.fetchall())
