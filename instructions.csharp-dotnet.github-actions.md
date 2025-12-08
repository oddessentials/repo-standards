# Repository Standards Instructions

> Auto-generated from `config\standards.csharp-dotnet.github-actions.json`
> Stack: C# / .NET | CI: github-actions

This document provides high-level guidance for an autonomous coding agent to bring a repository into compliance with the defined standards.

## Core Requirements

### Git and Docker Ignore Files

- Maintain proper .gitignore and .dockerignore files to prevent committing secrets, build artifacts, or unnecessary files.
- Ensure .gitignore exists in the repository.
- Consider adding .dockerignore if applicable.
- Use the official github/gitignore VisualStudio/.NET template. .dockerignore must exclude bin/, obj/, .vs/, \*.user, and similar local/build artifacts.

### Linting

- Run static code linting to enforce consistency and catch common issues early.
- Ensure .editorconfig exists in the repository.
- Consider adding Directory.Build.props if applicable.
- Define a `lint` script or equivalent command.
- Enable analyzers or style rules for the solution and review warnings regularly; enforce stricter rules on new code.

### Unit Test Runner

- Provide a deterministic unit test framework with a single command to run all tests.
- Consider adding \*.Tests.csproj if applicable.
- Group unit tests into dedicated test projects and keep them independent from external services.

### Containerization (Docker / Docker Compose)

- Provide a Dockerfile and, if applicable, a docker-compose file for local dev and CI parity.
- Ensure Dockerfile exists in the repository.
- Consider adding docker-compose.yml if applicable.
- Use multi-stage builds for .NET publish output and pin the SDK/runtime image versions to match CI.

### Semantic Versioning

- Use MAJOR.MINOR.PATCH versioning with clear rules and automated changelog generation based on commit history.

### Commit Linting

- Enforce structured commit messages such as Conventional Commits.
- Document your commit convention and wire up a helper tool so contributors can easily follow it.

### Unit Test Reporter / Coverage

- Generate readable unit test and coverage reports and enforce a minimum coverage threshold (around 80%) for new or changed code.
- Enable coverage collection for test projects and publish reports in a human-friendly format from CI.

### CI Quality Gates

- Single CI pipeline that runs linting, formatting, type checking, tests, coverage, build, and containerization.
- Ensure CI runs analyzers, tests, build, and packaging or container checks before changes can be merged.

### Code Formatter

- Automatic code formatting to maintain a consistent style across all contributors.
- Use .editorconfig and dotnet-format to keep C# style consistent across contributors.

### Pre-Commit Hooks

- Use git hooks to run linting, formatting, tests, and commit linting before changes are committed.
- Configure Lefthook or similar to run formatting and basic checks on staged files before commits.

### Type Checking

- Use static type checking to catch errors before runtime and enforce strictness on new code.
- Ensure .editorconfig exists in the repository.
- Consider adding Directory.Build.props if applicable.
- Define a `typecheck` script or equivalent command.

### Dependency Management & Vulnerability Scanning

- Lock dependencies and scan regularly for known vulnerabilities; fail CI on newly introduced high-severity issues.
- Consider adding packages.lock.json if applicable.
- Enable package lock files and use vulnerability scanning to track and remediate high-risk dependencies.

### Runtime Version Specification

- Specify required runtime/engine versions in package manifests to ensure environment stability and prevent version-related issues across development teams.
- Consider adding global.json if applicable.

### Documentation Standards

- Maintain a comprehensive README and, where applicable, auto-generated API docs to support onboarding and maintainability.
- Ensure README.md exists in the repository.
- Consider adding docs/, docfx.json if applicable.
- Keep README and API docs in sync with the solution structure and public surface area.

### Repository Governance

- Include standard governance files (LICENSE, CODE_OF_CONDUCT.md, CONTRIBUTING.md), branch protection rules, and review standards to define legal, ethical, and workflow expectations.
- Ensure LICENSE exists in the repository.
- Consider adding CODE_OF_CONDUCT.md, CONTRIBUTING.md if applicable.
- Document contribution expectations and ensure legal and code-of-conduct policies are easy to find.

## Recommended Practices

### Integration Testing

- Test how components interact with each other and external systems, running after unit tests with more relaxed coverage thresholds.
- Create dedicated integration test projects that exercise real infrastructure or service boundaries where appropriate.

### Performance Baselines

- Establish performance baselines and monitor for regressions using lightweight benchmarks or audits in CI.
- Use BenchmarkDotNet or similar to track performance of critical methods or endpoints over time.

### Complexity Analysis

- Measure cyclomatic complexity or similar metrics to keep code maintainable, starting as a warning-only check.
- Use code metrics or Sonar analysis to flag overly complex methods and refactor them over time.

### Accessibility Auditing

- Run accessibility checks on web-facing components to detect critical issues and improve inclusive UX.
- Apply accessibility tooling to ASP.NET or Blazor front-ends and review issues alongside functional testing.

## Optional Enhancements

### Observability (Logging & Error Handling)

- Standardize error handling and structured logging to make debugging and production monitoring easier.
- Configure structured logging for your .NET services and ensure exceptions and key events are logged with useful context.
