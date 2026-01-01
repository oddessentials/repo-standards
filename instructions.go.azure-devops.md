# Repository Standards Instructions

> Auto-generated from `config/standards.go.azure-devops.json`
> Stack: Go | CI: azure-devops

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
- Verify with: .golangci.yml or .golangci.yaml indicates linting is configured. Run 'golangci-lint run' to verify.
- Ensure go.mod exists in the repository.
- Common tools: golangci-lint, staticcheck. Example config files: .golangci.yml, .golangci.yaml.
- Consider adding .golangci.yml, .golangci.yaml if applicable.

### Unit Test Runner

- Provide a deterministic unit test framework with a single command to run all tests.
- Verify with: Run 'go test ./...' to verify the test suite is configured and passing.
- Ensure go.mod exists in the repository.
- Common tools: go test. Example config files: go.mod.
- Bazel commands: `bazel test //...`.

### Containerization (Docker / Docker Compose)

- Provide a Dockerfile and, if applicable, a docker-compose file for local dev and CI parity.
- Verify with: Dockerfile must be present; docker-compose.yml is optional and indicates orchestration usage.
- Ensure Dockerfile exists in the repository.
- Example config files: Dockerfile, docker-compose.yml.
- Consider adding docker-compose.yml if applicable.

### Semantic Versioning

- Use MAJOR.MINOR.PATCH versioning with clear rules and automated changelog generation based on commit history.
- Verify with: Check that git tags follow vMAJOR.MINOR.PATCH format and goreleaser or similar tool generates releases and changelogs.
- Common tools: goreleaser, semantic-release. Example config files: .goreleaser.yml, CHANGELOG.md.
- Go uses git tags for versioning (v1.2.3 format). Use goreleaser for automated releases with changelog generation. Tag versions consistently.

### Commit Linting

- Enforce structured commit messages such as Conventional Commits.
- Verify with: Test that non-conforming commit messages are rejected by the configured hooks or CI check.
- Common tools: commitlint, commitizen. Example config files: commitlint.config.js, .cz.toml.
- Use commitlint with pre-commit hooks for enforcing Conventional Commits. Consistent with goreleaser changelog generation.

### Unit Test Reporter / Coverage

- Generate readable unit test and coverage reports and enforce a minimum coverage threshold (around 80%) for new or changed code.
- Verify with: Run 'go test -cover ./...' and verify coverage reports are produced and thresholds monitored.
- Common tools: go test -cover, go tool cover. Example config files: go.mod.
- Bazel commands: `bazel coverage //...`.
- rules_go supports coverage via bazel coverage. Use --combined_report=lcov for aggregated output.

### CI Quality Gates

- Single CI pipeline that runs linting, formatting, type checking, tests, coverage, build, and containerization.
- Verify with: Verify CI runs golangci-lint, go test, and go build before merging to main.
- Example config files: .github/workflows/\*, azure-pipelines.yml.
- Bazel commands: `bazel build //...`, `bazel test //...`.
- rules_go go_binary and go_test targets provide hermetic builds and tests.

### Code Formatter

- Automatic code formatting to maintain a consistent style across all contributors.
- Verify with: Run 'gofmt -d .' or 'goimports -d .' and confirm no output indicates clean formatting.
- Common tools: gofmt, goimports.
- Bazel commands: `bazel run @go_sdk//:bin/gofmt -- -d .`.
- Run gofmt via the Bazel-managed Go SDK for hermetic formatting checks.

### Pre-Commit Hooks

- Use git hooks to run linting, formatting, tests, and commit linting before changes are committed.
- Verify with: Inspect hooks configuration and confirm that go fmt and golangci-lint run before commits.
- Common tools: pre-commit, lefthook. Example config files: .pre-commit-config.yaml, lefthook.yml.
- Use pre-commit with go hooks for gofmt, goimports, and golangci-lint on staged files.

### Type Checking

- Use static type checking to catch errors before runtime and enforce strictness on new code.
- Verify with: Run 'go build ./...' to verify type correctness. Use 'go vet ./...' for additional static analysis.
- Ensure go.mod exists in the repository.
- Common tools: go vet, staticcheck. Example config files: go.mod.
- Bazel commands: `bazel build //...`.

### Dependency Management & Vulnerability Scanning

- Lock dependencies and scan regularly for known vulnerabilities; fail CI on newly introduced high-severity issues.
- Verify with: go.sum is present; run 'govulncheck ./...' to verify security scanning.
- Ensure go.sum exists in the repository.
- Common tools: govulncheck, nancy. Example config files: go.sum.
- Use govulncheck (official Go tool) for vulnerability scanning. go.sum locks dependency checksums for reproducible builds.

### Runtime Version Specification

- Specify required runtime/engine versions in package manifests to ensure environment stability and prevent version-related issues across development teams.
- Verify with: go.mod must contain 'go' directive specifying minimum version; .go-version is optional for local development.
- Ensure go.mod exists in the repository.
- Example config files: go.mod, .go-version.
- Consider adding .go-version if applicable.

### Documentation Standards

- Maintain a comprehensive README and, where applicable, auto-generated API docs to support onboarding and maintainability.
- Verify with: README.md is present; documentation comments exist in exported functions/types.
- Ensure README.md exists in the repository.
- Common tools: godoc, pkgsite. Example config files: README.md, docs/.
- Consider adding docs/ if applicable.

### Repository Governance

- Include standard governance files (LICENSE, CODE_OF_CONDUCT.md, CONTRIBUTING.md), branch protection rules, and review standards to define legal, ethical, and workflow expectations.
- Verify with: LICENSE file is present; CODE_OF_CONDUCT.md and CONTRIBUTING.md provide contribution guidance.
- Ensure LICENSE exists in the repository.
- Example config files: LICENSE, CODE_OF_CONDUCT.md, CONTRIBUTING.md.
- Consider adding CODE_OF_CONDUCT.md, CONTRIBUTING.md if applicable.

## Recommended Practices

### Dependency Update Automation

- Automate dependency updates using Renovate or Dependabot to keep dependencies current and reduce security exposure window.
- Verify with: Check for renovate.json OR .github/dependabot.yml. Verify Go module PRs.
- Ensure at least one of renovate.json, .renovaterc.json, .github/dependabot.yml is present.
- Common tools: renovate, dependabot. Example config files: renovate.json, .github/dependabot.yml.
- Both support go.mod/go.sum. Renovate handles replace directives better. Security scanning is covered by dependency-security (govulncheck).

### Dependency Architecture Rules

- Enforce module boundaries and import constraints to prevent architectural drift and unwanted coupling.
- Verify with: Run 'go mod verify' and 'go mod tidy' with diff check in CI.
- Common tools: depaware, go-mod-check.

### Integration Testing

- Test how components interact with each other and external systems, running after unit tests with more relaxed coverage thresholds.
- Verify with: Confirm integration tests exist and run 'go test -tags=integration ./...' to verify.
- Common tools: go test. Example config files: \*\_test.go.
- Use build tags (//go:build integration) or separate test directories for integration tests. Run with 'go test -tags=integration ./...'.

### Performance Baselines

- Establish performance baselines and monitor for regressions using lightweight benchmarks or audits in CI.
- Verify with: Run 'go test -bench=. ./...' and verify benchmark results are tracked over time.
- Common tools: go test -bench, benchstat. Example config files: \*\_test.go.
- Use 'go test -bench=. ./...' for benchmarks. Use benchstat to compare results across runs.

### Complexity Analysis

- Measure cyclomatic complexity or similar metrics to keep code maintainable, starting as a warning-only check.
- Verify with: Run 'gocyclo' or 'golangci-lint run' and review complexity reports, ensuring new code doesn't exceed thresholds.
- Common tools: gocyclo, golangci-lint. Example config files: .golangci.yml.
- Use gocyclo or golangci-lint's gocyclo linter to measure cyclomatic complexity. Configure threshold in .golangci.yml.

### Accessibility Auditing

- Run accessibility checks on web-facing components to detect critical issues and improve inclusive UX.
- Verify with: For web-facing Go apps, run accessibility audits against key routes using axe or pa11y.
- Common tools: axe-core, pa11y.
- For Go web apps, use headless browser-based accessibility tools to audit rendered HTML from templates.

## Optional Enhancements

### Observability (Logging & Error Handling)

- Standardize error handling and structured logging to make debugging and production monitoring easier.
- Verify with: Confirm that a structured logging library is configured with appropriate output format and log levels.
- Common tools: slog, zap, zerolog.
- Use slog (stdlib) or zap/zerolog for structured logging. Configure JSON output for production and text for development.
