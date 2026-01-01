# Repository Standards Instructions

> Auto-generated from `config/standards.csharp-dotnet.azure-devops.json`
> Stack: C# / .NET | CI: azure-devops

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
- Verify with: .editorconfig must exist to drive the .NET formatting and analysis tooling.
- Ensure .editorconfig exists in the repository.
- Common tools: Roslyn analyzers, StyleCop. Example config files: .editorconfig, Directory.Build.props.
- Consider adding Directory.Build.props if applicable.

### Unit Test Runner

- Provide a deterministic unit test framework with a single command to run all tests.
- Verify with: Test projects are present in the solution; test configuration is defined.
- Common tools: xUnit, NUnit, MSTest. Example config files: \*.Tests.csproj.
- Consider adding \*.Tests.csproj if applicable.
- Bazel commands: `bazel test //...`.

### Containerization (Docker / Docker Compose)

- Provide a Dockerfile and, if applicable, a docker-compose file for local dev and CI parity.
- Verify with: Dockerfile must be present; docker-compose.yml is optional and indicates orchestration usage.
- Ensure Dockerfile exists in the repository.
- Example config files: Dockerfile, docker-compose.yml.
- Consider adding docker-compose.yml if applicable.

### Semantic Versioning

- Use MAJOR.MINOR.PATCH versioning with clear rules and automated changelog generation based on commit history.
- Verify with: Check that versioning is driven by a SemVer-aware tool (for example, GitVersion) and verify that running the release/versioning step locally or in CI automatically produces the expected version metadata, updates project files, and generates changelog entries from commit history.
- Common tools: GitVersion. Example config files: GitVersion.yml, \*.csproj, CHANGELOG.md.

### Commit Linting

- Enforce structured commit messages such as Conventional Commits.
- Verify with: Create a test commit following the documented commit convention and confirm that any configured commit message checks (local hooks or CI) accept the message.
- Common tools: commitlint, commitizen. Example config files: commitlint.config.\*, .cz.toml.
- Document your commit convention and wire up a helper tool so contributors can easily follow it.

### Unit Test Reporter / Coverage

- Generate readable unit test and coverage reports and enforce a minimum coverage threshold (around 80%) for new or changed code.
- Verify with: Run the test suite with coverage enabled (for example, using coverlet or a similar tool) and verify that coverage reports are generated and used in CI to monitor thresholds.
- Common tools: coverlet, ReportGenerator. Example config files: \*.csproj.
- Bazel commands: `bazel coverage //...`.
- Use rules_dotnet with coverage instrumentation enabled.

### CI Quality Gates

- Single CI pipeline that runs linting, formatting, type checking, tests, coverage, build, and containerization.
- Verify with: Open the CI configuration and verify there is a job or stage that runs analyzers, tests, build, and any required packaging or container checks before merging to main.
- Example config files: .github/workflows/\*, azure-pipelines.yml.
- Bazel commands: `bazel build //...`, `bazel test //...`.
- Bazel handles all analysis, testing, and packaging via defined targets.

### Code Formatter

- Automatic code formatting to maintain a consistent style across all contributors.
- Verify with: Run the configured formatter or code style enforcement (for example, `dotnet format`) and confirm that code in the repository conforms to the defined rules.
- Common tools: dotnet format. Example config files: .editorconfig.
- Bazel commands: `bazel run //tools/format:dotnet_format -- --verify-no-changes`.
- Wrap dotnet format as a Bazel run target.

### Pre-Commit Hooks

- Use git hooks to run linting, formatting, tests, and commit linting before changes are committed.
- Verify with: Inspect the hook configuration (for example, Lefthook or similar) and confirm it runs at least formatting and basic checks on staged changes before commits or pushes.
- Common tools: Lefthook. Example config files: lefthook.yml.
- Configure Lefthook or similar to run formatting and basic checks on staged files before commits.

### Type Checking

- Use static type checking to catch errors before runtime and enforce strictness on new code.
- Verify with: .editorconfig must exist; Directory.Build.props is optional for shared build configuration.
- Ensure .editorconfig exists in the repository.
- Common tools: Roslyn analyzers. Example config files: .editorconfig, Directory.Build.props, \*.csproj.
- Consider adding Directory.Build.props if applicable.

### Dependency Management & Vulnerability Scanning

- Lock dependencies and scan regularly for known vulnerabilities; fail CI on newly introduced high-severity issues.
- Verify with: Dependency lockfile or package reference is present; security scanning is configured.
- Common tools: dotnet list package --vulnerable. Example config files: packages.lock.json, \*.csproj.
- Consider adding packages.lock.json if applicable.
- Enable package lock files and use vulnerability scanning to track and remediate high-risk dependencies.

### Runtime Version Specification

- Specify required runtime/engine versions in package manifests to ensure environment stability and prevent version-related issues across development teams.
- Verify with: .csproj files must specify TargetFramework; global.json is recommended to pin SDK version.
- Example config files: \*.csproj, global.json.
- Consider adding global.json if applicable.

### Documentation Standards

- Maintain a comprehensive README and, where applicable, auto-generated API docs to support onboarding and maintainability.
- Verify with: README.md is present in the repository root; docs/ directory or DocFX configuration exists if applicable.
- Ensure README.md exists in the repository.
- Common tools: DocFX. Example config files: README.md, docfx.json.
- Consider adding docs/, docfx.json if applicable.

### Repository Governance

- Include standard governance files (LICENSE, CODE_OF_CONDUCT.md, CONTRIBUTING.md), branch protection rules, and review standards to define legal, ethical, and workflow expectations.
- Verify with: LICENSE file is present in the repository root; CODE_OF_CONDUCT.md and CONTRIBUTING.md are present for contribution guidance.
- Ensure LICENSE exists in the repository.
- Example config files: LICENSE, CODE_OF_CONDUCT.md, CONTRIBUTING.md.
- Consider adding CODE_OF_CONDUCT.md, CONTRIBUTING.md if applicable.

## Recommended Practices

### Dependency Update Automation

- Automate dependency updates using Renovate or Dependabot to keep dependencies current and reduce security exposure window.
- Verify with: Check for renovate.json OR .github/dependabot.yml. Verify NuGet update PRs.
- Ensure at least one of renovate.json, .renovaterc.json, .github/dependabot.yml is present.
- Common tools: renovate, dependabot. Example config files: renovate.json, .github/dependabot.yml.
- Pin Renovate version in pipeline definition.

### Dependency Architecture Rules

- Enforce module boundaries and import constraints to prevent architectural drift and unwanted coupling.
- Verify with: Build fails on namespace violations, or architecture tests run as part of test suite.
- Common tools: NsDepCop, ArchUnitNET. Example config files: NsDepCop.config.nsdepcop, ArchitectureTests.cs.
- Consider adding NsDepCop.config.nsdepcop if applicable.
- NsDepCop enforces namespace dependency rules via config file. ArchUnitNET uses test code for architectural assertions.

### Integration Testing

- Test how components interact with each other and external systems, running after unit tests with more relaxed coverage thresholds.
- Verify with: Confirm there is a test project or configuration dedicated to integration or API tests and run it to verify external or cross-service interactions behave as expected.
- Common tools: xUnit, NUnit, MSTest. Example config files: \*.IntegrationTests.csproj.
- Create dedicated integration test projects that exercise real infrastructure or service boundaries where appropriate.

### Performance Baselines

- Establish performance baselines and monitor for regressions using lightweight benchmarks or audits in CI.
- Verify with: Identify and run the configured performance or benchmarking suite (for example, BenchmarkDotNet) and review the output to ensure it is tracked against historical or target values.
- Common tools: BenchmarkDotNet. Example config files: \*.csproj.
- Use BenchmarkDotNet or similar to track performance of critical methods or endpoints over time.

### Complexity Analysis

- Measure cyclomatic complexity or similar metrics to keep code maintainable, starting as a warning-only check.
- Verify with: Run the configured code metrics or Sonar analysis and review complexity reports for key modules, ensuring that new or changed code stays within acceptable limits.
- Common tools: SonarQube, Visual Studio code metrics. Example config files: sonar-project.properties.
- Use code metrics or Sonar analysis to flag overly complex methods and refactor them over time.

### Accessibility Auditing

- Run accessibility checks on web-facing components to detect critical issues and improve inclusive UX.
- Verify with: For web-facing apps, run the configured accessibility checks or tools against your main UI endpoints and confirm that blocking accessibility issues are addressed.
- Common tools: axe-core, Accessibility Insights.
- Apply accessibility tooling to ASP.NET or Blazor front-ends and review issues alongside functional testing.

## Optional Enhancements

### Observability (Logging & Error Handling)

- Standardize error handling and structured logging to make debugging and production monitoring easier.
- Verify with: Confirm that a structured logging library (such as Serilog or NLog) is configured with an agreed sink and format, and that the application logs meaningful context for errors and key events.
- Common tools: Serilog, NLog. Example config files: appsettings.json.
- Configure structured logging for your .NET services and ensure exceptions and key events are logged with useful context.
