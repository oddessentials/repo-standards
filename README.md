[![npm version](https://img.shields.io/npm/v/@oddessentials/repo-standards.svg)](https://www.npmjs.com/package/@oddessentials/repo-standards)
[![CI](https://github.com/oddessentials/repo-standards/actions/workflows/ci.yml/badge.svg)](https://github.com/oddessentials/repo-standards/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@oddessentials/repo-standards.svg)](LICENSE)

# 🐝 Repository Standards & CI Checklist

**@oddessentials/repo-standards**

This package defines a **single, authoritative JSON specification** for repository quality standards across multiple stacks (TypeScript/JS, C#/.NET, Python), plus deterministic tooling to generate **stack- and CI-specific views**.

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

- `version` — schema version
- `meta` — global rules and migration policy
- `ciSystems` — supported CI platforms
  _(currently `github-actions`, `azure-devops`)_
- `stacks` — supported stacks:
  - `typescript-js`
  - `csharp-dotnet`
  - `python`

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
  - input to autonomous agents (e.g. Odd Hive Mind)

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
