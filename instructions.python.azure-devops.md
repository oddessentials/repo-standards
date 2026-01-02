# Repository Standards Instructions

> Auto-generated from `config/standards.python.azure-devops.json`
> Stack: Python | CI: azure-devops

This document provides high-level guidance for an autonomous coding agent to bring a repository into compliance with the defined standards.

## Core Requirements

### Git and Docker Ignore Files

- Maintain proper .gitignore and .dockerignore files to prevent committing secrets, build artifacts, or unnecessary files.
- Verify with: .gitignore must exist; .dockerignore is recommended when containerizing or using Docker workflows.
- Ensure .gitignore exists in the repository.
- Example config files: .gitignore, .dockerignore.
- Consider adding .dockerignore if applicable.

### Linting

- Run static code linting to enforce consistency and catch common issues early.
- Verify with: pyproject.toml (or ruff.toml / .flake8 / setup.cfg) signals that linting tools are configured for the repository.
- Ensure at least one of pyproject.toml, ruff.toml, .flake8, setup.cfg, tox.ini is present.
- Bazel commands: `bazel test //...:ruff_test`, `bazel run //tools/lint:ruff -- check .`.
- Example only; actual targets are repo-defined. Use rules_python with ruff wrapped as py_test or run target.

### Unit Test Runner

- Provide a deterministic unit test framework with a single command to run all tests.
- Verify with: Test framework configuration is present; tests/ directory or pytest configuration exists.
- Bazel commands: `bazel test //...`.
- Example only; actual targets are repo-defined. Use rules_python py_test for pytest-based tests.
- Common tools: pytest. Example config files: pytest.ini, pyproject.toml.

### Containerization (Docker / Docker Compose)

- Provide a Dockerfile and, if applicable, a docker-compose file for local dev and CI parity.
- Verify with: Dockerfile must be present; docker-compose.yml is optional and indicates orchestration usage.
- Ensure Dockerfile exists in the repository.
- Example config files: Dockerfile, docker-compose.yml.
- Consider adding docker-compose.yml if applicable.

### Semantic Versioning

- Use MAJOR.MINOR.PATCH versioning with clear rules and automated changelog generation based on commit history.
- Verify with: Check that the package version in pyproject or setup configuration follows SemVer and verify that the configured tool (for example, setuptools_scm or bumpversion) automatically computes or bumps the version and generates changelog entries from commit history or fragments.
- Common tools: bumpversion, setuptools_scm, towncrier. Example config files: pyproject.toml, setup.cfg, CHANGELOG.md.

### Commit Linting

- Enforce structured commit messages such as Conventional Commits.
- Verify with: Use the configured commit helper (for example, commitizen) or hooks to create a test commit and confirm that non-conforming messages are rejected while valid ones are accepted.
- Common tools: commitizen. Example config files: .cz.toml, pyproject.toml.
- Standardize commit messages using commitizen or a similar helper and document the required types and scopes.

### Unit Test Reporter / Coverage

- Generate readable unit test and coverage reports and enforce a minimum coverage threshold (around 80%) for new or changed code.
- Verify with: Run the unit tests with coverage (for example, pytest with pytest-cov) and confirm that coverage reports are generated and referenced in CI to enforce or track thresholds.
- Bazel commands: `bazel coverage //...`.
- Use rules_python py_test with coverage instrumentation. Combine with --combined_report=lcov.
- Common tools: pytest, pytest-cov, coverage.py. Example config files: pytest.ini, pyproject.toml.

### CI Quality Gates

- Single CI pipeline that runs linting, formatting, type checking, tests, coverage, build, and containerization.
- Verify with: Open the CI configuration and verify there is a job or stage that runs linting, type checking (if used), tests, and any packaging or container checks before merging to main.
- Bazel commands: `bazel build //...`, `bazel test //...`.
- Bazel py_binary and py_test targets replace traditional Python tooling.
- Example config files: .github/workflows/\*, azure-pipelines.yml.

### Code Formatter

- Automatic code formatting to maintain a consistent style across all contributors.
- Verify with: Run the configured formatter (for example, `black .` or `black --check .`) and confirm it reports clean formatting on committed code and auto-fixes as expected locally.
- Bazel commands: `bazel run //tools/format:black -- --check .`.
- Wrap black as a py_binary run target for format checking.
- Common tools: black. Example config files: pyproject.toml.

### Pre-Commit Hooks

- Use git hooks to run linting, formatting, tests, and commit linting before changes are committed.
- Verify with: Inspect .pre-commit-config.yaml and confirm that hooks for linting, formatting, and optionally type checking are enabled and run on changed files before commits.
- Common tools: pre-commit. Example config files: .pre-commit-config.yaml.
- Use pre-commit to run ruff, black, and optionally mypy on staged files before committing.

### Type Checking

- Use static type checking to catch errors before runtime and enforce strictness on new code.
- Verify with: pyproject.toml (or mypy.ini) signals that mypy configuration is available for the repository.
- Ensure pyproject.toml exists in the repository.
- Bazel commands: `bazel test //...:mypy_test`, `bazel run //tools/typecheck:mypy`.
- Example only; actual targets are repo-defined. Wrap mypy as a py_test or run target.

### Dependency Management & Vulnerability Scanning

- Lock dependencies and scan regularly for known vulnerabilities; fail CI on newly introduced high-severity issues.
- Verify with: Dependency lockfile is present; security scanning is configured in CI or project tooling.
- Common tools: pip-audit, safety. Example config files: requirements.txt, Pipfile.lock, poetry.lock.
- Consider adding requirements.txt, Pipfile.lock, poetry.lock if applicable.
- Pin dependency versions and routinely scan for vulnerabilities, prioritizing fixes for critical and high-severity issues.

### Runtime Version Specification

- Specify required runtime/engine versions in package manifests to ensure environment stability and prevent version-related issues across development teams.
- Verify with: pyproject.toml or setup.py must specify python_requires; .python-version is recommended for local development.
- Ensure pyproject.toml exists in the repository.
- Example config files: pyproject.toml, setup.py, .python-version.
- Consider adding .python-version if applicable.

### Documentation Standards

- Maintain a comprehensive README and, where applicable, auto-generated API docs to support onboarding and maintainability.
- Verify with: README.md is present in the repository root; docs/ directory or documentation tooling configuration exists if applicable.
- Ensure README.md exists in the repository.
- Common tools: Sphinx, MkDocs. Example config files: README.md, docs/.
- Consider adding docs/, mkdocs.yml if applicable.

### Repository Governance

- Include standard governance files (LICENSE, CODE_OF_CONDUCT.md, CONTRIBUTING.md), branch protection rules, and review standards to define legal, ethical, and workflow expectations.
- Verify with: LICENSE file is present in the repository root; CODE_OF_CONDUCT.md and CONTRIBUTING.md are present for contribution guidance.
- Ensure LICENSE exists in the repository.
- Example config files: LICENSE, CODE_OF_CONDUCT.md, CONTRIBUTING.md.
- Consider adding CODE_OF_CONDUCT.md, CONTRIBUTING.md if applicable.

## Recommended Practices

### Dependency Update Automation

- Automate dependency updates using Renovate or Dependabot to keep dependencies current and reduce security exposure window.
- Verify with: Check for renovate.json OR .github/dependabot.yml. Verify Python dependency PRs.
- Ensure at least one of renovate.json, .renovaterc.json, .github/dependabot.yml is present.
- Common tools: renovate, dependabot. Example config files: renovate.json, .github/dependabot.yml.
- Use requirements.txt with pinned versions or poetry.lock for deterministic installs.

### Dependency Architecture Rules

- Enforce module boundaries and import constraints to prevent architectural drift and unwanted coupling.
- Verify with: Run 'lint-imports' successfully. Config must exist in pyproject.toml [tool.importlinter] section OR .importlinter file.
- Common tools: import-linter, pydeps. Example config files: pyproject.toml, .importlinter.
- Consider adding pyproject.toml, .importlinter if applicable.
- Configure [tool.importlinter] in pyproject.toml OR use standalone .importlinter file. pydeps is visualization-only.

### Integration Testing

- Test how components interact with each other and external systems, running after unit tests with more relaxed coverage thresholds.
- Verify with: Confirm there is a separate integration or API test suite (for example, a dedicated tests/integration directory) and run it to verify interactions with databases, services, or external systems.
- Common tools: pytest. Example config files: tests/integration/.
- Separate integration tests from unit tests, using fixtures to handle databases, services, or other external systems.

### Performance Baselines

- Establish performance baselines and monitor for regressions using lightweight benchmarks or audits in CI.
- Verify with: Identify and run the configured performance checks or benchmarks (for example, pytest-benchmark or cProfile-based scripts) and confirm that their results are recorded and compared over time.
- Common tools: pytest-benchmark, cProfile. Example config files: pytest.ini, pyproject.toml.
- Use simple benchmarks or profiling runs to characterize bottlenecks and watch for regressions in critical workflows.

### Complexity Analysis

- Measure cyclomatic complexity or similar metrics to keep code maintainable, starting as a warning-only check.
- Verify with: Run the configured complexity tool (for example, radon) on the codebase and review the report to ensure new or heavily changed functions are not excessively complex.
- Common tools: radon. Example config files: radon.cfg.
- Use radon or similar tools to track complexity of Python functions and keep new code within acceptable limits.

### Accessibility Auditing

- Run accessibility checks on web-facing components to detect critical issues and improve inclusive UX.
- Verify with: For Python-backed web UIs, run the configured accessibility tooling (for example, pa11y or axe via a headless browser) against key routes and verify that critical issues are fixed or tracked.
- Common tools: pa11y.
- Use headless browser-based tools to scan Python-backed web UIs for accessibility issues on high-traffic routes.

## Optional Enhancements

### Observability (Logging & Error Handling)

- Standardize error handling and structured logging to make debugging and production monitoring easier.
- Verify with: Confirm that a structured logging setup (such as structlog or configured logging with JSON formatting) is in place and that critical paths log enough information to debug failures in production.
- Common tools: structlog, loguru. Example config files: logging configuration files, pyproject.toml.
- Use structured logging for Python services and ensure critical paths record enough context to debug issues after the fact.
