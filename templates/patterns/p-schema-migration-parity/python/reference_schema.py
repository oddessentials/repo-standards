"""Canonical schema source — the declared shape the running app expects.

Replace this module with your project's schema source. The parity test reads
``SCHEMA_SQL`` from here, materializes it in memory, and reads back the real
table set from ``sqlite_master``.
"""

from __future__ import annotations

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY,
    actor_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    occurred_at TEXT NOT NULL
);
"""

SCHEMA_VERSION_SEED = 3
"""Schema version seed — MUST equal max(target_version) across the migration
registry. Enforced by p-schema-version-monotonic."""

V1_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
);
"""
"""Oldest-supported seed. The parity test seeds a temp DB with this script
before running the migration chain so the test exercises the real legacy
upgrade path. If your project supports an older starting point, keep this
constant as the single source of truth and import it everywhere it's used —
never copy."""
