"""Runnable reference for the p-migration-ddl-parity pattern.

The reference persistence modules here are intentionally duplicated from
sibling persistence templates (p-schema-migration-parity,
p-required-tables-runtime-check, etc.) so each template is self-contained
for copy-and-adapt. Consumers typically copy
``test_migration_ddl_parity.py`` into their own test suite and re-point
imports at their project's persistence module.
"""
