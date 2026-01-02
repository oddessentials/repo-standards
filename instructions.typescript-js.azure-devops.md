# Repository Standards Instructions

> Auto-generated from `config/standards.typescript-js.azure-devops.json`
> Stack: TypeScript / JavaScript | CI: azure-devops

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
- Verify with: Presence of eslint.config.js (or any .eslintrc\* file) indicates linting is enforced for the repository.
- Ensure at least one of eslint.config.js, eslint.config.mjs, eslint.config.cjs, .eslintrc.js, .eslintrc.cjs, .eslintrc.json, .eslintrc.yaml, .eslintrc.yml is present.
- Define a `lint` script or equivalent command.
- Bazel commands: `bazel test //... --aspects=//tools:lint.bzl%eslint_aspect --output_groups=report`.

### Unit Test Runner

- Provide a deterministic unit test framework with a single command to run all tests.
- Verify with: Test framework configuration is present; test script is defined in package.json.
- Define a `test` script or equivalent command.
- Bazel commands: `bazel test //...`.
- Bazel discovers and runs all test targets. Use rules_js for Jest/Vitest integration.

### Containerization (Docker / Docker Compose)

- Provide a Dockerfile and, if applicable, a docker-compose file for local dev and CI parity.
- Verify with: Dockerfile must be present; docker-compose.yml is optional and indicates orchestration usage.
- Ensure Dockerfile exists in the repository.
- Example config files: Dockerfile, docker-compose.yml.
- Consider adding docker-compose.yml if applicable.

### Semantic Versioning

- Use MAJOR.MINOR.PATCH versioning with clear rules and automated changelog generation based on commit history.
- Verify with: Check that the version field follows SemVer, and trigger the configured release workflow (for example, a dry run of semantic-release or standard-version) to confirm it automatically generates the expected next version, updates package.json, and creates/updates CHANGELOG.md with commit-based entries.
- Common tools: semantic-release, standard-version. Example config files: .releaserc, package.json, CHANGELOG.md.

### Commit Linting

- Enforce structured commit messages such as Conventional Commits.
- Verify with: Create a test commit using the documented convention and ensure the commit message passes the configured commit linting or wizard (for example, commitlint or commitizen).
- Common tools: @commitlint/cli, @commitlint/config-conventional. Example config files: commitlint.config.\*.
- Enforce commit message format via commit-msg hooks (e.g., Husky) before CI.

### Unit Test Reporter / Coverage

- Generate readable unit test and coverage reports and enforce a minimum coverage threshold (around 80%) for new or changed code.
- Verify with: Run the unit tests with coverage enabled and confirm that a coverage report is produced and that the configured threshold (around 80%) is enforced for new changes.
- Bazel commands: `bazel coverage //...`.
- Bazel coverage collects coverage data from all test targets. Use --combined_report=lcov for aggregated reports.
- Common tools: jest, nyc. Example config files: jest.config.\*.

### CI Quality Gates

- Single CI pipeline that runs linting, formatting, type checking, tests, coverage, build, and containerization.
- Verify with: Open the CI configuration and verify there is a job or stage that runs linting, type checking, tests, build, and any required container checks before merging to main.
- Bazel commands: `bazel build //...`, `bazel test //...`.
- Replace npm run ci with Bazel commands. All quality gates run as Bazel targets.
- Example config files: .github/workflows/\*, azure-pipelines.yml.

### Code Formatter

- Automatic code formatting to maintain a consistent style across all contributors.
- Verify with: Run the formatter in check mode (for example, `npm run format:check`) and confirm it reports clean formatting on committed code and auto-fixes as expected locally.
- Bazel commands: `bazel run //tools/format:check`, `bazel test //...:format_test`.
- Wrap Prettier as a run target for formatting checks. Use aspect_rules_lint for format aspects.
- Common tools: prettier. Example config files: .prettierrc.\*, .prettierignore.

### Pre-Commit Hooks

- Use git hooks to run linting, formatting, tests, and commit linting before changes are committed.
- Verify with: Inspect the pre-commit and commit-msg hooks (for example, files under .husky or other hook tooling) and confirm they run linting/formatting and commit linting on staged changes.
- Common tools: husky, lint-staged. Example config files: .husky/, package.json.
- Run ESLint and Prettier on staged files and enforce commit message format via commit-msg hooks.

### Type Checking

- Use static type checking to catch errors before runtime and enforce strictness on new code.
- Verify with: Presence of tsconfig.json indicates type-checking is configured for the repository.
- Ensure tsconfig.json exists in the repository.
- Define a `typecheck` script or equivalent command.
- Bazel commands: `bazel build //...`.

### Dependency Management & Vulnerability Scanning

- Lock dependencies and scan regularly for known vulnerabilities; fail CI on newly introduced high-severity issues.
- Verify with: Dependency lockfile is present; security scanning is configured in CI or project tooling.
- Common tools: npm audit, Snyk. Example config files: package-lock.json, pnpm-lock.yaml, yarn.lock.
- Consider adding package-lock.json, pnpm-lock.yaml, yarn.lock if applicable.
- Require a lockfile for reproducible installs and pin Node.js/tooling versions; block merges on new high-severity vulnerabilities.

### Runtime Version Specification

- Specify required runtime/engine versions in package manifests to ensure environment stability and prevent version-related issues across development teams.
- Verify with: package.json must contain an 'engines' field specifying the required Node.js version.
- Ensure package.json exists in the repository.
- Example config files: package.json.

### Documentation Standards

- Maintain a comprehensive README and, where applicable, auto-generated API docs to support onboarding and maintainability.
- Verify with: README.md is present in the repository root; docs/ directory or documentation tooling configuration exists if applicable.
- Ensure README.md exists in the repository.
- Common tools: JSDoc, TypeDoc. Example config files: README.md, docs/.
- Consider adding docs/, typedoc.json if applicable.

### Repository Governance

- Include standard governance files (LICENSE, CODE_OF_CONDUCT.md, CONTRIBUTING.md), branch protection rules, and review standards to define legal, ethical, and workflow expectations.
- Verify with: LICENSE file is present in the repository root; CODE_OF_CONDUCT.md and CONTRIBUTING.md are present for contribution guidance.
- Ensure LICENSE exists in the repository.
- Example config files: LICENSE, CODE_OF_CONDUCT.md, CONTRIBUTING.md.
- Consider adding CODE_OF_CONDUCT.md, CONTRIBUTING.md if applicable.

## Recommended Practices

### Dependency Update Automation

- Automate dependency updates using Renovate or Dependabot to keep dependencies current and reduce security exposure window.
- Verify with: Check for renovate.json (or .renovaterc.json) OR .github/dependabot.yml. Verify dependency update PRs are being created.
- Ensure at least one of renovate.json, .renovaterc.json, renovate.json5, .renovaterc.json5, .github/dependabot.yml is present.
- Common tools: renovate, dependabot. Example config files: renovate.json, .github/dependabot.yml.
- Pin Renovate Docker image version in AzDO pipelines for determinism.

### Dependency Architecture Rules

- Enforce module boundaries and import constraints to prevent architectural drift and unwanted coupling.
- Verify with: Run 'npx depcruise --validate' or equivalent. Verify architectural rules are documented and enforced.
- Ensure at least one of .dependency-cruiser.cjs, .dependency-cruiser.js, dependency-cruiser.config.cjs, .dependency-cruiser.mjs is present.
- Common tools: dependency-cruiser. Example config files: .dependency-cruiser.cjs, .dependency-cruiser.js, dependency-cruiser.config.cjs.
- Pin dependency-cruiser version in package.json devDependencies.

### Integration Testing

- Test how components interact with each other and external systems, running after unit tests with more relaxed coverage thresholds.
- Verify with: Confirm there is a separate integration or end-to-end test command or configuration and run it to verify that cross-component flows behave as expected.
- Common tools: Jest, Supertest, Playwright. Example config files: jest.config._, playwright.config._.
- Use Supertest for HTTP APIs and Playwright or similar tools for end-to-end flows; keep integration suites slower but reliable.

### Performance Baselines

- Establish performance baselines and monitor for regressions using lightweight benchmarks or audits in CI.
- Verify with: Identify and run the configured performance or Lighthouse-style checks and verify that key metrics are captured and compared to documented baselines.
- Common tools: Lighthouse CI, custom Node.js benchmarks. Example config files: lighthouserc.json.
- Run Lighthouse CI for web apps and basic Node benchmarks on critical endpoints; schedule runs or limit to key branches to keep CI fast.

### Complexity Analysis

- Measure cyclomatic complexity or similar metrics to keep code maintainable, starting as a warning-only check.
- Verify with: Run the configured complexity tooling or rules (for example, ESLint complexity rules or Sonar analysis) and review any hot spots, ensuring new code does not exceed agreed thresholds.
- Common tools: ESLint complexity rules, SonarQube. Example config files: .eslintrc.\*, sonar-project.properties.
- Warn on overly complex functions and methods; fail CI only when new or modified code exceeds thresholds.

### Accessibility Auditing

- Run accessibility checks on web-facing components to detect critical issues and improve inclusive UX.
- Verify with: For web-facing apps, run the configured accessibility tooling (for example, axe, pa11y, or Lighthouse accessibility audits) against key pages and confirm that critical issues are resolved.
- Common tools: axe-core, Lighthouse accessibility audits.
- Run accessibility checks against key pages or components in CI; fail on critical violations while treating minor issues as warnings initially.

## Optional Enhancements

### Observability (Logging & Error Handling)

- Standardize error handling and structured logging to make debugging and production monitoring easier.
- Verify with: Confirm that a structured logging library (such as Winston or Pino) is configured to emit JSON or key-value logs and that error handling routes important failures through this logger.
- Common tools: Winston, Pino.
- Adopt structured JSON logging with correlation IDs and send logs to a centralized sink in production.
