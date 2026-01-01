# Repository Standards Instructions

> Auto-generated from `config/standards.python.github-actions.json`
> Stack: Python | CI: github-actions

This document provides high-level guidance for an autonomous coding agent to bring a repository into compliance with the defined standards.

## Core Requirements

### Git and Docker Ignore Files

- Maintain proper .gitignore and .dockerignore files to prevent committing secrets, build artifacts, or unnecessary files.
- Ensure .gitignore exists in the repository.
- Consider adding .dockerignore if applicable.
- Use the official github/gitignore Python template. Include **pycache**, .venv/, .pytest_cache, .env, and similar local-only files. .dockerignore must exclude .git, virtual environments, and caches.

### Linting

- Run static code linting to enforce consistency and catch common issues early.
- Configure a primary linter (such as ruff) and keep rules focused on catching real issues without overwhelming developers.

### Unit Test Runner

- Provide a deterministic unit test framework with a single command to run all tests.
- Consider adding pytest.ini, pyproject.toml, tests/ if applicable.
- Organize unit tests under a tests/ directory and avoid real network or database calls in this layer.

### Containerization (Docker / Docker Compose)

- Provide a Dockerfile and, if applicable, a docker-compose file for local dev and CI parity.
- Ensure Dockerfile exists in the repository.
- Consider adding docker-compose.yml if applicable.
- Choose a slim Python base image, pin the version, and clearly document how to start the service in a container.

### Semantic Versioning

- Use MAJOR.MINOR.PATCH versioning with a single canonical version source, automated changelog generation, and synchronized artifact publishing.
- Treat pyproject.toml/setuptools_scm as the canonical version source (git tags or bumpversion). Configure CI to update versions, generate/update CHANGELOG.md, create git tags, and publish release artifacts in one workflow. Maintain a single source of truth for versioning.

### Commit Linting

- Enforce structured commit messages such as Conventional Commits.
- Standardize commit messages using commitizen or a similar helper and document the required types and scopes. Release automation depends on commit messages for versioning and changelog generation.

### Deterministic/Hermetic Builds

- Ensure builds are reproducible and hermetic by pinning toolchains, locking dependencies, and avoiding hidden network inputs.
- Pin Python/tooling versions, use lockfiles, and build in clean CI environments so outputs are reproducible and hermetic.

### Provenance & Security Scanning

- Generate provenance/attestations for release artifacts and scan dependencies/artifacts for security issues before publishing.
- Publish SBOMs and provenance attestations with release artifacts and scan dependencies/images before publishing.

### Unit Test Reporter / Coverage

- Generate readable unit test and coverage reports and enforce a minimum coverage threshold (around 80%) for new or changed code.
- Configure coverage reporting for your test suite and surface summary metrics in CI.

### CI Quality Gates

- Single CI pipeline that runs linting, formatting, type checking, tests, coverage, build, and containerization.
- Ensure CI runs linting, type checking (if used), tests, and packaging or container checks for Python services before merging.

### Code Formatter

- Automatic code formatting to maintain a consistent style across all contributors.
- Use black (or an equivalent opinionated formatter) and treat its output as the single source of truth for code style.

### Pre-Commit Hooks

- Use git hooks to run linting, formatting, tests, and commit linting before changes are committed.
- Use pre-commit to run ruff, black, and optionally mypy on staged files before committing.

### Type Checking

- Use static type checking to catch errors before runtime and enforce strictness on new code.
- Ensure pyproject.toml exists in the repository.
- Consider adding mypy.ini if applicable.
- Adopt gradual typing with type hints and mypy, focusing first on critical modules and new code paths.

### Dependency Management & Vulnerability Scanning

- Lock dependencies and scan regularly for known vulnerabilities; fail CI on newly introduced high-severity issues.
- Consider adding requirements.txt, Pipfile.lock, poetry.lock if applicable.
- Pin dependency versions and routinely scan for vulnerabilities, prioritizing fixes for critical and high-severity issues.

### Runtime Version Specification

- Specify required runtime/engine versions in package manifests to ensure environment stability and prevent version-related issues across development teams.
- Ensure pyproject.toml exists in the repository.
- Consider adding .python-version if applicable.
- Specify python_requires in pyproject.toml (e.g., requires-python = ">=3.9") or setup.py (e.g., python_requires='>=3.9'). Consider adding .python-version for pyenv users to automatically switch to the correct Python version.

### Documentation Standards

- Maintain a comprehensive README and, where applicable, auto-generated API docs to support onboarding and maintainability.
- Ensure README.md exists in the repository.
- Consider adding docs/, mkdocs.yml if applicable.
- Ensure README explains environment setup and core commands, and generate API docs from docstrings where appropriate.

### Repository Governance

- Include standard governance files (LICENSE, CODE_OF_CONDUCT.md, CONTRIBUTING.md), branch protection rules, and review standards to define legal, ethical, and workflow expectations.
- Ensure LICENSE exists in the repository.
- Consider adding CODE_OF_CONDUCT.md, CONTRIBUTING.md if applicable.
- Spell out contributor responsibilities for tests, documentation, and review so expectations are clear for Python-focused teams.

## Recommended Practices

### Dependency Update Automation

- Automate dependency updates using Renovate or Dependabot to keep dependencies current and reduce security exposure window.
- Renovate supports pyproject.toml, requirements.txt, Pipfile, poetry.lock. For AzDO: self-hosted Renovate or schedule-triggered pipeline.

### Dependency Architecture Rules

- Enforce module boundaries and import constraints to prevent architectural drift and unwanted coupling.
- Consider adding pyproject.toml, .importlinter if applicable.
- Configure [tool.importlinter] in pyproject.toml OR use standalone .importlinter file. pydeps is visualization-only.

### Integration Testing

- Test how components interact with each other and external systems, running after unit tests with more relaxed coverage thresholds.
- Separate integration tests from unit tests, using fixtures to handle databases, services, or other external systems.

### Performance Baselines

- Establish performance baselines and monitor for regressions using lightweight benchmarks or audits in CI.
- Use simple benchmarks or profiling runs to characterize bottlenecks and watch for regressions in critical workflows.

### Complexity Analysis

- Measure cyclomatic complexity or similar metrics to keep code maintainable, starting as a warning-only check.
- Use radon or similar tools to track complexity of Python functions and keep new code within acceptable limits.

### Accessibility Auditing

- Run accessibility checks on web-facing components to detect critical issues and improve inclusive UX.
- Use headless browser-based tools to scan Python-backed web UIs for accessibility issues on high-traffic routes.

## Optional Enhancements

### Observability (Logging & Error Handling)

- Standardize error handling and structured logging to make debugging and production monitoring easier.
- Use structured logging for Python services and ensure critical paths record enough context to debug issues after the fact.
