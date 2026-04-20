"""DDL structural parity: fresh SCHEMA_SQL ≡ migrated-from-v1 chain.

Defect class prevented
----------------------
``SCHEMA_SQL`` and the migration chain are two independent expressions of
the same intent. They drift silently:

- Column added to ``SCHEMA_SQL`` with ``NOT NULL``; migration omits the
  constraint. Fresh DBs reject null writes; legacy DBs accept them.
- Index declared in ``SCHEMA_SQL``; migration forgets to create it. Fresh
  DBs have the index; legacy DBs full-scan.
- Foreign key added to ``SCHEMA_SQL``; migration's ``ALTER TABLE`` path
  silently drops the FK. Fresh DBs enforce; legacy DBs don't.

This test walks every table via ``PRAGMA`` and compares the two
materializations structurally.

Scope discipline
----------------
This test locks **PRAGMA-level structural equivalence** — not raw DDL text.
It must NOT be extended to compare ``CREATE TABLE`` / ``CREATE INDEX``
strings, diff whitespace, assert column declaration order, or assert
auto-generated index names (``sqlite_autoindex_*``).

Raw DDL comparison is classic churn bait: semantically-equivalent
statements render as different text under different tools, the test fails
on unrelated formatting, consumers bypass it, the real defect class
(semantic drift) stops being protected.

(See ``mp-churn-bait-discipline``.)

Adaptation
----------
Copy this file into your test suite and adjust the imports. Required hooks:

- ``SCHEMA_SQL: str`` — canonical declared schema
- ``V1_SCHEMA_SQL: str`` — oldest-supported seed
- ``DatabaseManager.connect()`` — runs the registered migration chain
"""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Tuple

from . import reference_schema
from .reference_database import DatabaseManager


ColumnTuple = Tuple[str, str, int, Any, int]
# (name, type, notnull, default, pk) — cid is dropped (declaration order
# artifact, not semantic).


def _pragma_table_info(conn: sqlite3.Connection, table: str) -> List[ColumnTuple]:
    """Return column definitions as a sorted list (order-insensitive).

    Dropping ``cid`` (declaration order) so two tables with the same
    columns in different order compare equal. Column order is cosmetic in
    SQLite unless you care about ``SELECT *`` column-position — that's a
    workload contract, not a schema invariant, so we leave it out.
    """
    rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
    columns: List[ColumnTuple] = [tuple(row[1:]) for row in rows]
    return sorted(columns)


def _pragma_index_list(
    conn: sqlite3.Connection, table: str
) -> List[Tuple[str, int, int]]:
    """User-created indexes on the table (excluding auto-indexes).

    ``origin='c'`` means ``CREATE INDEX`` — i.e., user-defined. ``'u'`` is
    ``UNIQUE`` constraint-derived, ``'pk'`` is primary-key-derived. Those
    are structurally implied by the column definitions we already captured
    via ``PRAGMA table_info`` and comparing them again is redundant noise.
    """
    rows = conn.execute(f"PRAGMA index_list({table})").fetchall()
    return sorted((row[1], row[2], row[4]) for row in rows if row[3] == "c")


def _pragma_index_info(
    conn: sqlite3.Connection, index_name: str
) -> List[str]:
    """Column names in an index, in declaration order.

    Column order IS meaningful here — ``INDEX (a, b)`` ≠ ``INDEX (b, a)``
    for query-plan purposes. Returned in seqno order.
    """
    rows = conn.execute(f"PRAGMA index_info({index_name})").fetchall()
    return [row[2] for row in sorted(rows, key=lambda r: r[0])]


def _enumerate_tables(conn: sqlite3.Connection) -> List[str]:
    cursor = conn.execute(
        "SELECT name FROM sqlite_master "
        "WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )
    return sorted(row[0] for row in cursor.fetchall())


def _snapshot(conn: sqlite3.Connection) -> Dict[str, Dict[str, Any]]:
    """Structural snapshot: ``{table: {"columns": [...], "indexes": {name: {...}}}}``."""
    snapshot: Dict[str, Dict[str, Any]] = {}
    for table in _enumerate_tables(conn):
        indexes: Dict[str, Dict[str, Any]] = {}
        for idx_name, unique, partial in _pragma_index_list(conn, table):
            indexes[idx_name] = {
                "unique": unique,
                "partial": partial,
                "columns": _pragma_index_info(conn, idx_name),
            }
        snapshot[table] = {
            "columns": _pragma_table_info(conn, table),
            "indexes": indexes,
        }
    return snapshot


def _fresh_schema_snapshot(schema_sql: str) -> Dict[str, Dict[str, Any]]:
    conn = sqlite3.connect(":memory:")
    try:
        conn.executescript(schema_sql)
        return _snapshot(conn)
    finally:
        conn.close()


def _migrated_chain_snapshot(tmp_path: Path) -> Dict[str, Dict[str, Any]]:
    db_path = tmp_path / "migrated.db"
    seed = sqlite3.connect(str(db_path))
    try:
        seed.executescript(reference_schema.V1_SCHEMA_SQL)
    finally:
        seed.close()
    manager = DatabaseManager(db_path)
    manager.connect()
    try:
        assert manager.connection is not None
        return _snapshot(manager.connection)
    finally:
        manager.close()


def _compute_diff(
    fresh: Dict[str, Dict[str, Any]], migrated: Dict[str, Dict[str, Any]]
) -> Tuple[List[str], List[str]]:
    """Return ``(drift_identifiers, message_lines)``."""
    drift: List[str] = []
    lines: List[str] = []

    for table in sorted(set(fresh) | set(migrated)):
        if table not in fresh:
            drift.append(f"{table}:table")
            lines.append(f"  table '{table}' only in migrated DB")
            continue
        if table not in migrated:
            drift.append(f"{table}:table")
            lines.append(f"  table '{table}' only in fresh-schema DB")
            continue
        if fresh[table]["columns"] != migrated[table]["columns"]:
            drift.append(f"{table}:columns")
            lines.append(
                f"  '{table}' columns differ:\n"
                f"    fresh:    {fresh[table]['columns']!r}\n"
                f"    migrated: {migrated[table]['columns']!r}"
            )
        fresh_idx = set(fresh[table]["indexes"])
        migrated_idx = set(migrated[table]["indexes"])
        if fresh_idx != migrated_idx:
            drift.append(f"{table}:indexes")
            only_fresh = sorted(fresh_idx - migrated_idx)
            only_migrated = sorted(migrated_idx - fresh_idx)
            if only_fresh:
                lines.append(
                    f"  '{table}' indexes only in fresh-schema DB: {only_fresh}"
                )
            if only_migrated:
                lines.append(
                    f"  '{table}' indexes only in migrated DB: {only_migrated}"
                )
        for idx_name in sorted(fresh_idx & migrated_idx):
            if (
                fresh[table]["indexes"][idx_name]
                != migrated[table]["indexes"][idx_name]
            ):
                drift.append(f"{table}:indexes:{idx_name}")
                lines.append(
                    f"  '{table}' index '{idx_name}' shape differs:\n"
                    f"    fresh:    {fresh[table]['indexes'][idx_name]!r}\n"
                    f"    migrated: {migrated[table]['indexes'][idx_name]!r}"
                )
    return drift, lines


def _check_ddl_parity(
    schema_sql: str, tmp_path: Path
) -> Tuple[List[str], str]:
    """Return ``(drift_identifiers, formatted_message)``.

    Empty ``drift_identifiers`` means parity holds. When non-empty, callers
    raise ``message`` as the assertion failure; the wording is the single
    source of truth so happy-path and red-path tests cannot drift.
    """
    fresh = _fresh_schema_snapshot(schema_sql)
    migrated = _migrated_chain_snapshot(tmp_path)
    drift, lines = _compute_diff(fresh, migrated)
    if not drift:
        return [], ""
    message = (
        "DDL structural drift between SCHEMA_SQL and migrated-from-v1 chain:\n"
        + "\n".join(lines)
        + "\nRemediation: update the migration that introduced the drifting "
        "shape to match SCHEMA_SQL, or update SCHEMA_SQL to match the "
        "migrated shape — whichever is authoritative in your project."
    )
    return drift, message


class TestMigrationDdlParity:
    """Happy path: healthy schema + migrations produce structurally equal DBs."""

    def test_fresh_schema_matches_migrated_chain(self, tmp_path: Path) -> None:
        drift, message = _check_ddl_parity(
            reference_schema.SCHEMA_SQL, tmp_path
        )
        assert not drift, message


class TestMigrationDdlParityRedPath:
    """Adversarial tests — prove the gate fires on the regression case.

    Required by ``mp-adversarial-proof-required``.
    """

    def test_detects_schema_drift(self, tmp_path: Path) -> None:
        """Fabricated-regression: strip ``NOT NULL`` from ``users.email`` in
        a _copy_ of ``SCHEMA_SQL`` (never mutating the constant). Confirm
        the gate reports a column-level drift on ``users``.
        """
        drifted_schema = reference_schema.SCHEMA_SQL.replace(
            "email TEXT NOT NULL UNIQUE",
            "email TEXT UNIQUE",
        )
        assert drifted_schema != reference_schema.SCHEMA_SQL, (
            "test setup bug: drifted_schema should differ from SCHEMA_SQL"
        )

        drift, message = _check_ddl_parity(drifted_schema, tmp_path)

        assert "users:columns" in drift, (
            f"gate failed to detect NOT NULL drift on users.email — got: {drift}"
        )
        assert "users" in message, (
            f"gate message must name the affected table, got: {message!r}"
        )
        assert "columns differ" in message, (
            f"gate message must identify the divergence type, got: {message!r}"
        )

    def test_detects_missing_index(self, tmp_path: Path) -> None:
        """Fabricated-regression: add a ``CREATE INDEX`` to a _copy_ of
        ``SCHEMA_SQL`` with no corresponding migration. Confirm the gate
        names the missing index.
        """
        canary_index = (
            "\nCREATE INDEX IF NOT EXISTS idx_canary_users_created "
            "ON users(created_at);\n"
        )
        drift, message = _check_ddl_parity(
            reference_schema.SCHEMA_SQL + canary_index, tmp_path
        )

        assert any(d == "users:indexes" for d in drift), (
            f"gate failed to detect missing index on users — got: {drift}"
        )
        assert "idx_canary_users_created" in message, (
            f"gate message must name the missing index, got: {message!r}"
        )
