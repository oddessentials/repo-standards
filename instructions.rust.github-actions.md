# Repository Standards Instructions

> Auto-generated from `config/standards.rust.github-actions.json`
> Stack: Rust | CI: github-actions

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
- Verify with: Clippy is available via rustup component. Run 'cargo clippy' to verify linting is configured.
- Ensure Cargo.toml exists in the repository.
- Bazel commands: `bazel build //... --aspects=@rules_rust//rust:defs.bzl%clippy_aspect --output_groups=clippy_checks`.
- Example only; actual targets are repo-defined. rules_rust includes clippy_aspect for Bazel-native Clippy linting.

### Unit Test Runner

- Provide a deterministic unit test framework with a single command to run all tests.
- Verify with: Run 'cargo test' to verify the test suite is configured and passing.
- Ensure Cargo.toml exists in the repository.
- Bazel commands: `bazel test //...`.
- rules_rust rust_test targets run cargo test under Bazel's hermetic environment.

### Containerization (Docker / Docker Compose)

- Provide a Dockerfile and, if applicable, a docker-compose file for local dev and CI parity.
- Verify with: Dockerfile must be present; docker-compose.yml is optional and indicates orchestration usage.
- Ensure Dockerfile exists in the repository.
- Example config files: Dockerfile, docker-compose.yml.
- Consider adding docker-compose.yml if applicable.

### Semantic Versioning

- Use MAJOR.MINOR.PATCH versioning with clear rules and automated changelog generation based on commit history.
- Verify with: Check that Cargo.toml version follows SemVer and verify changelog generation from commit history.
- Common tools: cargo-release, semantic-release. Example config files: Cargo.toml, CHANGELOG.md.

### Commit Linting

- Enforce structured commit messages such as Conventional Commits.
- Verify with: Test that non-conforming commit messages are rejected by the configured hooks or CI check.
- Common tools: commitlint, commitizen. Example config files: commitlint.config.js, .cz.toml.
- Use commitlint with husky or pre-commit for enforcing Conventional Commits. Works consistently with cargo workspaces.

### Unit Test Reporter / Coverage

- Generate readable unit test and coverage reports and enforce a minimum coverage threshold (around 80%) for new or changed code.
- Verify with: Run 'cargo tarpaulin' or equivalent and verify coverage reports are generated and thresholds enforced.
- Bazel commands: `bazel coverage //...`.
- Bazel coverage with rules_rust requires LLVM instrumentation. May need additional toolchain configuration.
- Common tools: cargo-tarpaulin, llvm-cov, grcov. Example config files: Cargo.toml.

### CI Quality Gates

- Single CI pipeline that runs linting, formatting, type checking, tests, coverage, build, and containerization.
- Verify with: Verify CI runs cargo clippy, cargo test, and cargo build before merging to main.
- Bazel commands: `bazel build //...`, `bazel test //...`.
- rules_rust provides rust_library, rust_test, and clippy_aspect for complete CI.
- Example config files: .github/workflows/\*, azure-pipelines.yml.

### Code Formatter

- Automatic code formatting to maintain a consistent style across all contributors.
- Verify with: Run 'cargo fmt --check' and confirm it reports clean formatting. Use 'cargo fmt' to auto-fix.
- Bazel commands: `bazel build //... --aspects=@rules_rust//rust:defs.bzl%rustfmt_aspect --output_groups=rustfmt_checks`.
- rules_rust includes rustfmt_aspect for Bazel-native format checking.
- Common tools: rustfmt. Example config files: rustfmt.toml, .rustfmt.toml.

### Pre-Commit Hooks

- Use git hooks to run linting, formatting, tests, and commit linting before changes are committed.
- Verify with: Inspect .pre-commit-config.yaml and confirm that hooks run cargo fmt --check and cargo clippy before commits.
- Common tools: pre-commit, cargo-husky. Example config files: .pre-commit-config.yaml.
- Use pre-commit with rust hooks for cargo fmt and cargo clippy on staged files. cargo-husky is an alternative.

### Type Checking

- Use static type checking to catch errors before runtime and enforce strictness on new code.
- Verify with: Run 'cargo check' or 'cargo build' to verify type correctness. All Rust code is type-checked by default.
- Ensure Cargo.toml exists in the repository.
- Bazel commands: `bazel build //...`.
- Rust type checking is inherent to compilation. bazel build with rules_rust enforces type safety.

### Dependency Management & Vulnerability Scanning

- Lock dependencies and scan regularly for known vulnerabilities; fail CI on newly introduced high-severity issues.
- Verify with: Cargo.lock is present; run 'cargo audit' or 'cargo deny check' to verify security scanning.
- Ensure at least one of Cargo.lock is present.
- Common tools: cargo-audit, cargo-deny. Example config files: Cargo.lock, deny.toml.
- Required for binaries/services; optional for libraries (add to .gitignore for libs). See https://doc.rust-lang.org/cargo/faq.html#why-have-cargolock-in-version-control

### Runtime Version Specification

- Specify required runtime/engine versions in package manifests to ensure environment stability and prevent version-related issues across development teams.
- Verify with: rust-toolchain.toml or rust-toolchain file specifies the required Rust version.
- Example config files: rust-toolchain.toml, rust-toolchain.
- Consider adding rust-toolchain.toml, rust-toolchain if applicable.

### Documentation Standards

- Maintain a comprehensive README and, where applicable, auto-generated API docs to support onboarding and maintainability.
- Verify with: README.md is present; run 'cargo doc' to generate API docs.
- Ensure README.md exists in the repository.
- Common tools: rustdoc, mdBook. Example config files: README.md, docs/.
- Consider adding docs/, book.toml if applicable.

### Repository Governance

- Include standard governance files (LICENSE, CODE_OF_CONDUCT.md, CONTRIBUTING.md), branch protection rules, and review standards to define legal, ethical, and workflow expectations.
- Verify with: LICENSE file is present; CODE_OF_CONDUCT.md and CONTRIBUTING.md provide contribution guidance.
- Ensure LICENSE exists in the repository.
- Example config files: LICENSE, CODE_OF_CONDUCT.md, CONTRIBUTING.md.
- Consider adding CODE_OF_CONDUCT.md, CONTRIBUTING.md if applicable.

## Recommended Practices

### Dependency Update Automation

- Automate dependency updates using Renovate or Dependabot to keep dependencies current and reduce security exposure window.
- Verify with: Check for renovate.json OR .github/dependabot.yml. Verify Cargo dependency PRs.
- Ensure at least one of renovate.json, .renovaterc.json, .github/dependabot.yml is present.
- Common tools: renovate, dependabot. Example config files: renovate.json, .github/dependabot.yml.
- Both support Cargo.toml/Cargo.lock. Works with cargo workspaces. Security scanning is covered by dependency-security (cargo-audit/cargo-deny).

### Dependency Architecture Rules

- Enforce module boundaries and import constraints to prevent architectural drift and unwanted coupling.
- Verify with: Run 'cargo deny check bans' to verify dependency constraints.
- Common tools: cargo-deny. Example config files: deny.toml.
- Consider adding deny.toml if applicable.
- cargo-deny's [bans] section enforces dependency graph rules (deny specific crates, wildcards). Extend existing config if using for security scanning.

### Integration Testing

- Test how components interact with each other and external systems, running after unit tests with more relaxed coverage thresholds.
- Verify with: Confirm tests/ directory contains integration tests and run 'cargo test' to verify cross-component flows.
- Common tools: cargo test. Example config files: tests/.
- Use the tests/ directory for integration tests. Use #[ignore] attribute for slow tests and run with 'cargo test -- --ignored'.

### Performance Baselines

- Establish performance baselines and monitor for regressions using lightweight benchmarks or audits in CI.
- Verify with: Run 'cargo bench' and verify benchmark results are captured and compared against baselines.
- Common tools: criterion, cargo bench. Example config files: benches/.
- Use criterion for statistical benchmarking. Create benches/ directory for benchmark files. Track results over time in CI.

### Complexity Analysis

- Measure cyclomatic complexity or similar metrics to keep code maintainable, starting as a warning-only check.
- Verify with: Run 'cargo clippy' and review complexity-related warnings. Ensure new code stays within acceptable limits.
- Common tools: clippy, cargo-geiger. Example config files: clippy.toml.
- Clippy includes cognitive complexity warnings. Use cargo-geiger for unsafe code metrics. Configure thresholds in clippy.toml.

### Accessibility Auditing

- Run accessibility checks on web-facing components to detect critical issues and improve inclusive UX.
- Verify with: For web-facing Rust apps, run accessibility audits against key routes using axe or pa11y.
- Common tools: axe-core, pa11y.
- For Rust web frameworks (Actix, Axum, Rocket), use headless browser-based accessibility tools to audit rendered HTML.

## Optional Enhancements

### Observability (Logging & Error Handling)

- Standardize error handling and structured logging to make debugging and production monitoring easier.
- Verify with: Confirm that tracing or log crate is configured with appropriate subscriber/logger and emits structured output.
- Common tools: tracing, log.
- Use the tracing crate for structured logging with spans and events. Configure tracing-subscriber for output formatting.
