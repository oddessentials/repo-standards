# Repository Standards Instructions

> Auto-generated from `config/standards.typescript-js.github-actions.json`
> Stack: TypeScript / JavaScript | CI: github-actions

This document provides high-level guidance for an autonomous coding agent to bring a repository into compliance with the defined standards.

## Core Requirements

### Git and Docker Ignore Files

- Maintain proper .gitignore and .dockerignore files to prevent committing secrets, build artifacts, or unnecessary files.
- Ensure .gitignore exists in the repository.
- Consider adding .dockerignore if applicable.
- Use the official github/gitignore Node template as a base and add .env*, node_modules, dist/, coverage/, *.log, npm-debug.log\*, etc. .dockerignore must exclude node_modules, .git, and local build output.

### Linting

- Run static code linting to enforce consistency and catch common issues early.
- Consider adding .prettierrc, prettier.config.js, prettier.config.cjs and others if applicable.
- Define a `lint` script or equivalent command.
- Treat new lint errors as CI failures; keep existing issues as warnings until addressed.

### Unit Test Runner

- Provide a deterministic unit test framework with a single command to run all tests.
- Consider adding jest.config.js, jest.config.ts, vitest.config.js and others if applicable.
- Define a `test` script or equivalent command.
- Keep unit tests fast and deterministic; move slow or flaky tests into integration or E2E suites.

### Containerization (Docker / Docker Compose)

- Provide a Dockerfile and, if applicable, a docker-compose file for local dev and CI parity.
- Ensure Dockerfile exists in the repository.
- Consider adding docker-compose.yml if applicable.
- Use multi-stage builds and pin Node.js and base image versions in the Dockerfile to match CI (e.g., node:22-alpine).

### Semantic Versioning

- Use MAJOR.MINOR.PATCH versioning with a single canonical version source, automated changelog generation, and synchronized artifact publishing.
- Treat package.json as the canonical version source. Automate version bumping and changelog generation from Conventional Commits using semantic-release or standard-version. Configure CI to bump package.json, update CHANGELOG.md, create git tags, and publish release artifacts in the same workflow.

### Commit Linting

- Enforce structured commit messages such as Conventional Commits.
- Enforce commit message format via commit-msg hooks (e.g., Husky) before CI. Release automation depends on Conventional Commits for versioning and changelog generation.

### Deterministic/Hermetic Builds

- Ensure builds are reproducible and hermetic by pinning toolchains, locking dependencies, and avoiding hidden network inputs.
- Pin Node/tooling versions, use a lockfile, and run builds in clean CI containers so outputs are reproducible and hermetic.

### Provenance & Security Scanning

- Generate provenance/attestations for release artifacts and scan dependencies/artifacts for security issues before publishing.
- Publish SBOMs and provenance attestations with release artifacts and scan dependencies/images before publishing.

### Unit Test Reporter / Coverage

- Generate readable unit test and coverage reports and enforce a minimum coverage threshold (around 80%) for new or changed code.
- Collect coverage in lcov or similar format; use diff coverage so legacy gaps are visible but non-blocking.

### CI Quality Gates

- Single CI pipeline that runs linting, formatting, type checking, tests, coverage, build, and containerization.
- Expose a single npm script (e.g., `npm run ci`) that mirrors the CI pipeline so contributors can reproduce failures locally.

### Code Formatter

- Automatic code formatting to maintain a consistent style across all contributors.
- Run Prettier in check mode in CI; auto-fix locally via pre-commit hooks or editor integration.

### Pre-Commit Hooks

- Use git hooks to run linting, formatting, tests, and commit linting before changes are committed.
- Run ESLint and Prettier on staged files and enforce commit message format via commit-msg hooks.

### Type Checking

- Use static type checking to catch errors before runtime and enforce strictness on new code.
- Ensure tsconfig.json exists in the repository.
- Define a `typecheck` script or equivalent command.
- Enable strict mode ('strict': true) and treat type-check failures as CI failures for new code; gradually expand strictness into legacy modules. Prefer TypeScript-first development over new plain JavaScript.

### Dependency Management & Vulnerability Scanning

- Lock dependencies and scan regularly for known vulnerabilities; fail CI on newly introduced high-severity issues.
- Consider adding package-lock.json, pnpm-lock.yaml, yarn.lock if applicable.
- Require a lockfile for reproducible installs and pin Node.js/tooling versions; block merges on new high-severity vulnerabilities.

### Runtime Version Specification

- Specify required runtime/engine versions in package manifests to ensure environment stability and prevent version-related issues across development teams.
- Ensure package.json exists in the repository.
- Specify the 'engines' field in package.json to define the required Node.js version (e.g., "engines": { "node": ">=18.0.0" }). This helps prevent environment-related bugs and ensures all developers use compatible Node.js versions.

### Documentation Standards

- Maintain a comprehensive README and, where applicable, auto-generated API docs to support onboarding and maintainability.
- Ensure README.md exists in the repository.
- Consider adding docs/, typedoc.json if applicable.
- README should describe setup, scripts, and architecture; generate API docs from TypeScript types and JSDoc where helpful.

### Repository Governance

- Include standard governance files (LICENSE, CODE_OF_CONDUCT.md, CONTRIBUTING.md), branch protection rules, and review standards to define legal, ethical, and workflow expectations.
- Ensure LICENSE exists in the repository.
- Consider adding CODE_OF_CONDUCT.md, CONTRIBUTING.md if applicable.
- Use an SPDX license identifier in package.json and describe review expectations, tests, and docs requirements in CONTRIBUTING.md.

## Recommended Practices

### Dependency Update Automation

- Automate dependency updates using Renovate or Dependabot to keep dependencies current and reduce security exposure window.
- Renovate supports GHA + AzDO (self-hosted or Mend Renovate App). Dependabot is GitHub-native only. For AzDO: use Renovate via self-hosted runner, Docker container job, or Mend's hosted service.

### Dependency Architecture Rules

- Enforce module boundaries and import constraints to prevent architectural drift and unwanted coupling.
- Define forbidden imports, layer rules, and circular dependency bans. Run in CI as blocking check.

### Integration Testing

- Test how components interact with each other and external systems, running after unit tests with more relaxed coverage thresholds.
- Use Supertest for HTTP APIs and Playwright or similar tools for end-to-end flows; keep integration suites slower but reliable.

### Performance Baselines

- Establish performance baselines and monitor for regressions using lightweight benchmarks or audits in CI.
- Run Lighthouse CI for web apps and basic Node benchmarks on critical endpoints; schedule runs or limit to key branches to keep CI fast.

### Complexity Analysis

- Measure cyclomatic complexity or similar metrics to keep code maintainable, starting as a warning-only check.
- Warn on overly complex functions and methods; fail CI only when new or modified code exceeds thresholds.

### Accessibility Auditing

- Run accessibility checks on web-facing components to detect critical issues and improve inclusive UX.
- Run accessibility checks against key pages or components in CI; fail on critical violations while treating minor issues as warnings initially.

## Optional Enhancements

### Observability (Logging & Error Handling)

- Standardize error handling and structured logging to make debugging and production monitoring easier.
- Adopt structured JSON logging with correlation IDs and send logs to a centralized sink in production.
