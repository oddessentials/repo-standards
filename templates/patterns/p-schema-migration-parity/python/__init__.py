"""Runnable reference for the p-schema-migration-parity pattern.

The four modules here demonstrate one valid shape for the three hooks the
parity test assumes:

- ``reference_schema.SCHEMA_SQL`` — canonical declared schema
- ``reference_database.FUNDAMENTAL_TABLES`` — tables present since v1
- ``reference_database.DatabaseManager`` — runs the registered migration chain
- ``reference_migrations.MIGRATIONS`` — ordered registry of migrations

Consumers typically do not copy this whole package; they copy
``test_schema_migration_parity.py`` and re-point the imports at their own
persistence module.
"""
