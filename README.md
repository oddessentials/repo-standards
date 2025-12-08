# Repository Standards & CI Checklist

This repo defines a **single master JSON spec** for repository quality standards across multiple stacks (TypeScript/JS, C#/.NET, Python), plus a small utility to generate **stack-specific views**.

- Master spec: `config/standards.json`
- Generated stack views: `config/standards.<stack>[.<ciSystem>].json`
- Generator: `scripts/generate-standards.ts`

---

## Meta Rules

The master spec includes a `meta` block with global policies:

- **Coverage**  
  - `defaultCoverageThreshold = 0.8`  
  - Aim for ~80% coverage on **new or changed code**, using diff coverage where possible.
- **Soft-fail on legacy**  
  - `qualityGatePolicy.preferSoftFailOnLegacy = true`  
  - New checks (lint rules, types, complexity, etc.) should:
    - Warn on **existing** violations.
    - Fail CI only for **new violations** introduced in the current change.
- **Complexity checks**  
  - `complexityChecks.enabledByDefault = true`  
  - Complexity (cyclomatic or similar) should start as **warnings-only**, tightening over time.
- **Migration guide**  
  - `meta.migrationGuide` defines a stepwise approach:
    1. Local safety nets (pre-commit, lint, format).
    2. Mirror in CI with soft-fail on legacy.
    3. Add type safety, coverage, dependency security.
    4. Add docs, governance, integration/perf/accessibility checks, plus optional ML guidance for Python data teams.

---

## Structure of `config/standards.json`

- `version`: schema/version number for the spec.
- `meta`: global settings (coverage, complexity, migration guide, etc.).
- `ciSystems`: currently `["azure-devops", "github-actions"]`.
- `stacks`: supported stacks:
  - `typescript-js`
  - `csharp-dotnet`
  - `python`
- `checklist`:
  - `core`: must-have items (linting, tests, type-checking, dependency security, docs, repo governance, etc.).
  - `recommended`: high-value but optional (integration tests, perf baselines, complexity analysis, accessibility auditing).
  - `optionalEnhancements`: nice-to-haves (observability, logging patterns, etc.).

Each item includes:

- `id`, `label`, `description`
- `appliesTo.stacks` and `appliesTo.ciSystems`
- `ciHints`: suggested pipeline stage/job names
- `stackHints[stack]`:
  - `exampleTools`
  - `exampleConfigFiles`
  - `notes` (how to apply, trade-offs, ML variants for Python, etc.)

---

## Generating Stack-Specific JSON

The generator script reads `config/standards.json` and writes filtered views.

### Commands

From the repo root:

```bash
# TypeScript/JS, all CI systems
npm run generate:ci -- typescript-js

# Python, all CI systems
npm run generate:ci -- python

# C#/.NET, all CI systems
npm run generate:ci -- csharp-dotnet

# Python + Azure DevOps only
npm run generate:ci -- python azure-devops

# TypeScript/JS + GitHub Actions only
npm run generate:ci -- typescript-js github-actions
```

### Outputs

* All CI systems:

  ```text
  config/standards.typescript-js.json
  config/standards.csharp-dotnet.json
  config/standards.python.json
  ```

* Filtered by CI system (example):

  ```text
  config/standards.python.azure-devops.json
  config/standards.typescript-js.github-actions.json
  ```

These generated files are **artifacts**, not hand-edited. Treat `config/standards.json` as the **source of truth**.

---

## How to Apply to a Repo

1. Pick your stack (`typescript-js`, `csharp-dotnet`, or `python`).

2. Generate the filtered view:

   ```bash
   npm run generate:ci -- python
   ```

3. Use the resulting `config/standards.python.json` as:

   * A checklist for onboarding.
   * Input to internal docs/onboarding tools.
   * A contract for CI (what must pass before merging).

4. For existing repos, follow `meta.migrationGuide`:

   * Start with pre-commit hooks and formatting.
   * Mirror checks in CI (soft-fail legacy).
   * Add type safety, coverage, dependency security.
   * Layer in docs, governance, integration/perf/accessibility, and ML-specific practices if applicable.

## Instruction generation

### Default (TypeScript + GitHub Actions)

`npm run generate:instructions`

### Python stack

`npm run generate:instructions -- standards.python.json`

### C#/.NET with Azure DevOps

`npm run generate:instructions -- standards.csharp-dotnet.azure-devops.json`
