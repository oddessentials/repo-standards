"""Canonical schema source carrying the version seed."""

from __future__ import annotations

SCHEMA_VERSION_SEED = 3
"""The schema version fresh DBs boot at.

MUST equal ``max(target_version)`` across the registered migrations —
otherwise fresh DBs will not execute the latest migration and will diverge
from migrated DBs. Enforced by the gate in this template.
"""

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
