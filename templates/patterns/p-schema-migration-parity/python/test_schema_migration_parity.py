"""Static parity: every SCHEMA_SQL table is fundamental or migration-created.

Defect class prevented
----------------------
A ``CREATE TABLE`` added to the canonical schema source without a paired
migration ships silently. Fresh databases receive the table (bootstrapped
from ``SCHEMA_SQL``) but legacy databases upgrade through the migration
chain that never mentions it and reach the running app missing it. First
production write hits ``sqlite3.OperationalError: no such table``.

This test runs at PR-CI time on the introducing commit and fails with a
message that names the offending tables and both remediation paths.

Scope discipline
----------------
This test locks **table-name presence only**. It must NOT be extended to
column shapes, index presence, constraint bodies, or any prose in the
surrounding schema doc. Use ``p-migration-ddl-parity`` for byte-level
structural equivalence. Widening the lock surface here turns the test into
churn bait — consumers bypass it on the first unrelated column-rename PR
and the original defect class stops being protected.

(See ``mp-churn-bait-discipline``.)

Adaptation
----------
Copy this file into your test suite and adjust the imports to point at
your project's persistence layer. The test requires three hooks:

- ``SCHEMA_SQL: str`` — canonical declared schema
- ``FUNDAMENTAL_TABLES: frozenset[str]`` — tables present since v1
- ``DatabaseManager.connect()`` — runs the registered migration chain

The ``V1_SCHEMA_SQL`` constant is the oldest-supported seed; keep it as a
single source of truth in your persistence module and import it here,
never copy.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Tuple

from . import reference_schema
from .reference_database import FUNDAMENTAL_TABLES, DatabaseManager


def _user_table_names(conn: sqlite3.Connection) -> frozenset[str]:
    """Table names excluding SQLite internals (``sqlite_sequence`` etc.)."""
    cursor = conn.execute(
        "SELECT name FROM sqlite_master "
        "WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )
    return frozenset(row[0] for row in cursor.fetchall())


def _enumerate_schema_sql_tables(schema_sql: str) -> frozenset[str]:
    """Materialize ``schema_sql`` in memory and read the real declared set.

    Real materialization is materially more robust than regex/AST scanning
    of the DDL — it captures whatever tables SQLite actually creates,
    regardless of statement form (``CREATE TABLE`` vs ``CREATE TABLE IF
    NOT EXISTS`` vs multi-statement scripts).
    """
    conn = sqlite3.connect(":memory:")
    try:
        conn.executescript(schema_sql)
        return _user_table_names(conn)
    finally:
        conn.close()


def _enumerate_migration_chain_tables(tmp_path: Path) -> frozenset[str]:
    """Tables present after running the full chain on the v1 seed.

    Goes through :class:`DatabaseManager` rather than calling each
    ``_migrate_vN_to_vN+1`` directly so the test exercises the real upgrade
    path legacy databases hit — including ordering and any pre/post
    validation the manager performs.
    """
    db_path = tmp_path / "migration-chain.db"
    seed = sqlite3.connect(str(db_path))
    try:
        seed.executescript(reference_schema.V1_SCHEMA_SQL)
    finally:
        seed.close()
    manager = DatabaseManager(db_path)
    manager.connect()
    try:
        assert manager.connection is not None
        return _user_table_names(manager.connection)
    finally:
        manager.close()


def _check_parity(
    schema_sql: str, tmp_path: Path
) -> Tuple[frozenset[str], str]:
    """Return ``(unmigrated_tables, formatted_message)``.

    Single source of truth for the failure wording so happy-path and
    red-path tests cannot drift. When ``unmigrated_tables`` is empty,
    parity holds.
    """
    schema_tables = _enumerate_schema_sql_tables(schema_sql)
    chain_tables = _enumerate_migration_chain_tables(tmp_path)
    allowed = FUNDAMENTAL_TABLES | chain_tables
    unmigrated = schema_tables - allowed
    message = (
        f"Tables declared in SCHEMA_SQL but neither in FUNDAMENTAL_TABLES "
        f"nor created by any registered migration: {sorted(unmigrated)}. "
        "Remediation: add a migration that creates each missing table, or "
        "extend FUNDAMENTAL_TABLES if the table has been part of this "
        "project's schema since v1."
    )
    return unmigrated, message


class TestSchemaMigrationParity:
    """Happy path: healthy schema passes."""

    def test_schema_sql_tables_are_fundamental_or_migration_created(
        self, tmp_path: Path
    ) -> None:
        unmigrated, message = _check_parity(
            reference_schema.SCHEMA_SQL, tmp_path
        )
        assert not unmigrated, message


class TestSchemaMigrationParityRedPath:
    """Adversarial tests — prove the gate fires on the regression case.

    Required by ``mp-adversarial-proof-required``: a gate without a red
    path is a gate you cannot trust. A broadened assertion, a swallowed
    exception, or a permissive matcher would let the happy-path test pass
    while silently failing to enforce anything; these tests close that
    drift surface.
    """

    def test_detects_missing_migration(self, tmp_path: Path) -> None:
        """Fabricated-regression test: append a canary ``CREATE TABLE`` to a
        _copy_ of ``SCHEMA_SQL`` (never mutating the module constant) and
        confirm the gate names the canary explicitly in its failure message.
        """
        canary_ddl = (
            "\nCREATE TABLE IF NOT EXISTS unmigrated_canary "
            "(id INTEGER PRIMARY KEY);\n"
        )
        unmigrated, message = _check_parity(
            reference_schema.SCHEMA_SQL + canary_ddl, tmp_path
        )

        assert unmigrated == frozenset({"unmigrated_canary"}), (
            "gate failed to detect the synthetic unmigrated table — expected "
            f"{{'unmigrated_canary'}}, got {sorted(unmigrated)}"
        )
        assert "unmigrated_canary" in message, (
            f"gate message must name the offending table, got: {message!r}"
        )
        assert "migration" in message, (
            "gate message must mention migration as the primary remediation "
            f"path, got: {message!r}"
        )
        assert "FUNDAMENTAL_TABLES" in message, (
            "gate message must mention FUNDAMENTAL_TABLES as the secondary "
            f"remediation path, got: {message!r}"
        )

    def test_detects_missing_migration_when_chain_empty(
        self, tmp_path: Path
    ) -> None:
        """Removed-correctness test: simulate a broken/disabled migration
        runner by computing the unmigrated set against an empty chain. Every
        non-fundamental schema table must be flagged. Proves the
        migration-chain arm of the allowed set is load-bearing — if it
        silently became a no-op, this test would catch it.

        Fundamental tables remain covered; they're the escape hatch's whole
        purpose.
        """
        schema_tables = _enumerate_schema_sql_tables(reference_schema.SCHEMA_SQL)
        allowed_without_chain = FUNDAMENTAL_TABLES  # chain contribution removed
        unmigrated = schema_tables - allowed_without_chain

        assert "sessions" in unmigrated, (
            "removing the migration-chain arm should flag 'sessions' — "
            f"got: {sorted(unmigrated)}"
        )
        assert "audit_log" in unmigrated, (
            "removing the migration-chain arm should flag 'audit_log' — "
            f"got: {sorted(unmigrated)}"
        )
        assert "users" not in unmigrated, (
            "'users' stays covered by FUNDAMENTAL_TABLES even when the chain "
            f"is removed — that's the escape hatch's purpose; got: {sorted(unmigrated)}"
        )
