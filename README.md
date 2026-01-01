[![npm version](https://img.shields.io/npm/v/@oddessentials/repo-standards.svg)](https://www.npmjs.com/package/@oddessentials/repo-standards)
[![CI](https://github.com/oddessentials/repo-standards/actions/workflows/ci.yml/badge.svg)](https://github.com/oddessentials/repo-standards/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@oddessentials/repo-standards.svg)](LICENSE)

# 🐝 Repository Standards & CI Checklist

**@oddessentials/repo-standards**

This package defines a **single, authoritative JSON specification** for repository quality standards across multiple stacks (TypeScript/JS, C#/.NET, Python, Rust, and Go), plus deterministic tooling to generate **stack- and CI-specific views**.

It is designed to be:

- **Machine-readable** (for autonomous agents and CI systems)
- **Human-navigable** (for onboarding and audits)
- **Migration-friendly** (soft-fail legacy, hard-fail new violations)

> Think of this as a _policy catalog_, not an enforcement engine.

---

## What’s Included

- **Master spec (source of truth)**
  `config/standards.json`

- **Generated stack views (artifacts)**
  `config/standards.<stack>[.<ciSystem>].json`

- **Generator scripts**
  Deterministically derive filtered views from the master spec.

---

## Meta Rules (Global Policy)

The master spec includes a `meta` block that defines system-wide expectations:

### Coverage

- `defaultCoverageThreshold = 0.8`
- Target ~80% coverage on **new or changed code**
- Prefer diff-based coverage where supported

### Soft-Fail on Legacy

- `qualityGatePolicy.preferSoftFailOnLegacy = true`
- New checks should:
  - Warn on **existing** violations
  - Fail CI only for **new violations** introduced by the change

### Complexity

- `complexityChecks.enabledByDefault = true`
- Complexity rules start as **warnings**
- Intended to tighten gradually as codebases mature

### Migration Guide

`meta.migrationGuide` defines a stepwise adoption path:

1. Local safety nets (formatting, linting, pre-commit)
2. Mirror in CI with soft-fail legacy
3. Add type safety, coverage, dependency security
4. Add docs, governance, integration/perf/accessibility
   _(plus ML-specific practices for Python data teams)_

---

## Structure of `config/standards.json`

- `version` — schema version (currently `3`)
- `meta` — global rules and migration policy
- `ciSystems` — supported CI platforms
  _(currently `github-actions`, `azure-devops`)_
- `stacks` — supported stacks:
  - `typescript-js`
  - `csharp-dotnet`
  - `python`
  - `rust`
  - `go`

- `checklist`
  - `core` — must-have requirements
  - `recommended` — high-value additions
  - `optionalEnhancements` — advanced / nice-to-have

Each checklist item includes:

- `id`, `label`, `description`
- `appliesTo.stacks`, `appliesTo.ciSystems`
- `ciHints` — suggested pipeline stages
- `stackHints[stack]`
  - example tools
  - example config files
  - notes and trade-offs (including ML variants for Python)
  - `anyOfFiles` — either-or file compliance hints (v2+)
  - `pinningNotes` — version pinning guidance (v2+)

### Schema Version

The `version` field indicates schema compatibility:

- `1` — Original schema
- `2` — Adds `bazelHints`, `meta.executorHints.bazel` for Bazel support, `anyOfFiles`, `pinningNotes`, enforcement/severity levels, ratio-based coverage thresholds, Rust/Go stacks. Enforces strict validation with `additionalProperties: false`.
- `3` — Expands release, build determinism, and provenance/CI automation requirements; adds unified release workflow and template automation guidance.

Consumers should ignore unknown fields for forward compatibility.

---

## Dependency Governance (Recommended Items)

Two recommended checklist items support supply-chain governance:

| Item                            | Scope             | Primary Tools                            |
| ------------------------------- | ----------------- | ---------------------------------------- |
| `dependency-update-automation`  | Automated PR bots | Renovate (cross-CI), Dependabot (GitHub) |
| `dependency-architecture-rules` | Import boundaries | Varies by stack                          |

> **Note**: `dependency-security` (core) covers vulnerability scanning and lockfiles.
> These recommended items are complementary, not overlapping.

### Renovate vs Dependabot

| Factor             | Renovate            | Dependabot  |
| ------------------ | ------------------- | ----------- |
| CI Support         | GHA + AzDO + GitLab | GitHub only |
| Config Flexibility | High                | Medium      |
| Grouping           | Advanced            | Basic       |
| Automerge          | Configurable        | Limited     |

**Recommendation**: Use Renovate for cross-CI portability.

### Azure DevOps Renovate Setup

For Azure DevOps, Renovate requires one of:

1. **Mend Renovate Hosted Service** — Install from Azure Marketplace
2. **Self-Hosted Runner** — Scheduled pipeline with `renovate/renovate` Docker image
3. **Container Job** — Run Renovate in a container step

Required secrets:

- `AZURE_DEVOPS_TOKEN` (PAT with Code Read/Write, PR Contribute)

---

## Bazel Integration

This framework supports Bazel as an **optional build executor** for quality checks.

### Key Concepts

- **Bazel is optional** — Stack-native commands (npm, cargo, etc.) remain the default
- **Hints are advisory** — `bazelHints` are suggestions, not required execution paths
- **Commands are illustrative** — Actual Bazel commands are repo-defined; examples show patterns only
- **Detection is root-level** — Only `MODULE.bazel` / `WORKSPACE*` at repo root triggers Bazel mode

### Detection Rules

Repos are detected as Bazel-managed if the **repository root** contains:

1. `MODULE.bazel` (bzlmod, preferred)
2. `WORKSPACE.bazel` or `WORKSPACE` (legacy)

Optional markers: `.bazelrc`, `.bazelversion`

> Nested `BUILD.bazel` files (e.g., from vendored deps) do NOT trigger Bazel detection.

### Bazel Commands (Not Assumed Targets)

The `bazelHints.commands` field contains **actual commands to run**:

| Check        | Stack-native           | Bazel Command                    |
| ------------ | ---------------------- | -------------------------------- |
| Lint         | `npm run lint`         | `bazel test //... --aspects=...` |
| Format Check | `npm run format:check` | `bazel run //tools/format:check` |
| Type Check   | `npm run typecheck`    | `bazel build //...`              |
| Test         | `npm test`             | `bazel test //...`               |
| Coverage     | `npm run coverage`     | `bazel coverage //...`           |

> **Note**: Bazel commands shown are **illustrative patterns**. Actual targets (e.g., `//tools/lint:lint`, `//...:format_test`) are repo-defined and may not exist without explicit Bazel setup. `bazelHints` are advisory—consumers should prefer stack-native commands unless explicitly adopting Bazel.

### Minimal `.bazelrc` for CI

```bazelrc
# .bazelrc
build:ci --nokeep_going
build:ci --test_output=errors
```

### Example GitHub Actions

```yaml
- uses: bazel-contrib/setup-bazel@0.14.0
  with:
    bazelisk-cache: true

- run: bazel test //... --config=ci
```

### Example Azure DevOps

```yaml
- script: |
    curl -Lo bazelisk https://github.com/bazelbuild/bazelisk/releases/latest/download/bazelisk-linux-amd64
    chmod +x bazelisk && mv bazelisk /usr/local/bin/bazel
  displayName: "Install Bazelisk"

- script: bazel test //... --config=ci
  displayName: "Run Bazel Tests"
```

> Remote cache is optional and not required for basic CI.

### Opt-Out

To disable Bazel hints for a repo that contains Bazel files but uses npm for quality checks:

```json
{ "meta": { "executorHints": { "bazel": { "enabled": false } } } }
```

---

## Generating Stack-Specific JSON

The generator reads the master spec and produces filtered, deterministic outputs.

### Commands

```bash
# TypeScript / JavaScript
npm run generate:ci -- typescript-js

# Python
npm run generate:ci -- python

# C# / .NET
npm run generate:ci -- csharp-dotnet

# Python + Azure DevOps
npm run generate:ci -- python azure-devops

# TypeScript + GitHub Actions
npm run generate:ci -- typescript-js github-actions
```

### Outputs

All CI systems:

```text
config/standards.typescript-js.json
config/standards.csharp-dotnet.json
config/standards.python.json
```

Filtered by CI system (example):

```text
config/standards.python.azure-devops.json
config/standards.typescript-js.github-actions.json
```

> These generated files are **artifacts**.
> Do not edit them manually — always modify `config/standards.json`.

---

## Consuming This Package (npm)

Install:

```bash
npm install @oddessentials/repo-standards
```

Typical usage:

- Load the **master spec** for tooling or audits
- Load a **stack-specific view** as:
  - a CI contract
  - an onboarding checklist
  - input to autonomous agents

This package is intentionally **read-only** and **side-effect free**.

---

## How to Apply to a Repository

1. Identify the stack (`typescript-js`, `csharp-dotnet`, `python`)
2. Generate the filtered checklist
3. Use it as:
   - a baseline for CI
   - a migration checklist for legacy repos
   - a governance artifact for reviews

For existing repositories, follow `meta.migrationGuide` to adopt standards incrementally without breaking teams.

---

## Instruction Generation

Human-readable “agent instructions” can also be generated:

```bash
# Default (TypeScript + GitHub Actions)
npm run generate:instructions

# Python
npm run generate:instructions -- standards.python.json

# C# / .NET + Azure DevOps
npm run generate:instructions -- standards.csharp-dotnet.azure-devops.json
```

---

## Philosophy

🐝 **Small rules. Shared language. Predictable outcomes.**

This repo deliberately separates:

- **Policy definition** (what good looks like)
- **Enforcement** (handled elsewhere)
- **Execution** (CI, agents, humans)

That separation is what makes it composable, automatable, and safe.
