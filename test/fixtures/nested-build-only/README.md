# Nested BUILD Only Test Fixture

This fixture tests that Bazel detection does NOT trigger when only nested BUILD files exist.
There are no root-level markers (MODULE.bazel, WORKSPACE.bazel, WORKSPACE).
