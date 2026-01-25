# v7 Implementation Plan

> **BREAKING CHANGE**: This release requires consuming repositories to adopt new standards enforcement policies and tooling updates. Version 7 introduces strict-by-default enforcement, expanded security scanning, and enhanced AI governance patterns.

---

## Executive Summary

Version 7 transforms `@oddessentials/repo-standards` into a comprehensive enterprise-grade quality framework with:

- **Zero-tolerance enforcement** for new violations (lint, types, security)
- **Automated dependency governance** with security-first policies
- **Enhanced AI safety patterns** with explicit invariants
- **Unified command interface** across all consuming repositories
- **Shift-left quality gates** via dependency-cruiser and complexity analysis

---

## Current State Assessment

### What's Working Well (v6)

| Component            | Status  | Notes                                     |
| -------------------- | ------- | ----------------------------------------- |
| Semantic-release     | ✅ Good | CHANGELOG auto-generated                  |
| Commitlint           | ✅ Good | Conventional commits enforced             |
| Pre-commit hooks     | ✅ Good | lint-staged with prettier + eslint        |
| Line endings         | ✅ Good | .gitattributes enforces LF                |
| Renovate             | ✅ Good | Weekly updates with automerge for patches |
| Deterministic builds | ✅ Good | Bit-level reproducibility enforced        |
| CI pipeline          | ✅ Good | Lint, test, build, CRLF detection         |

### Gaps to Address in v7

| Gap                           | Current State     | v7 Target                                   |
| ----------------------------- | ----------------- | ------------------------------------------- |
| Pre-push hooks                | ❌ Missing        | Full verify before push                     |
| YAML linting                  | ❌ Missing        | yamllint required                           |
| Type-aware linting            | ⚠️ Disabled       | Enable strict type-checking rules           |
| Complexity enforcement        | ⚠️ Warn only      | Error on new violations                     |
| Security scanning             | ⚠️ npm audit only | Add semgrep + npm audit --audit-level       |
| Circular dependency detection | ❌ Missing        | dependency-cruiser required                 |
| `any` type elimination        | ⚠️ Not enforced   | `@typescript-eslint/no-explicit-any: error` |
| AI invariants                 | ⚠️ Templates only | Embedded in spec with enforcement           |
| Test coverage threshold       | ⚠️ Not enforced   | 80% minimum enforced in CI                  |
| Push/CI parity                | ⚠️ Partial        | Full parity guaranteed                      |

---

## Phase 1: Foundation Hardening

### 1.1 Strict TypeScript Configuration

**File**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": ".",
    "moduleDetection": "force",
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["node"]
  },
  "include": ["src", "scripts"],
  "exclude": ["dist", "node_modules"]
}
```

### 1.2 Type-Aware ESLint Configuration

**File**: `eslint.config.mjs`

```javascript
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import yamlPlugin from "eslint-plugin-yml";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  // TypeScript files with type-aware linting
  {
    files: ["**/*.ts"],
    ignores: ["dist/**", "node_modules/**"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // Strict TypeScript rules (errors for new repos, warnings for legacy)
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "warn",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/strict-boolean-expressions": "warn",

      // Complexity (error threshold)
      complexity: ["error", 15],
      "max-depth": ["error", 4],
      "max-lines-per-function": [
        "warn",
        { max: 100, skipBlankLines: true, skipComments: true },
      ],
    },
  },

  // YAML files
  ...yamlPlugin.configs["flat/standard"],
  {
    files: ["**/*.yml", "**/*.yaml"],
    rules: {
      "yml/no-empty-document": "error",
      "yml/no-empty-key": "error",
      "yml/no-empty-sequence-entry": "error",
    },
  },
];
```

### 1.3 New Dependencies to Add

**File**: `package.json` - devDependencies additions

```json
{
  "devDependencies": {
    "eslint-plugin-yml": "^1.17.0",
    "yaml-eslint-parser": "^1.2.3",
    "dependency-cruiser": "^16.10.2",
    "@vitest/coverage-v8": "^4.0.15",
    "eslint-plugin-security": "^3.0.1"
  }
}
```

### 1.4 Dependency-Cruiser Configuration

**File**: `.dependency-cruiser.cjs`

```javascript
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular dependencies cause maintenance nightmares",
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: "no-orphans",
      severity: "warn",
      comment: "Orphan modules indicate dead code",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$",
          "\\.d\\.ts$",
          "(^|/)tsconfig\\.json$",
          "(^|/)vitest\\.config\\.",
          "test/fixtures",
        ],
      },
      to: {},
    },
    {
      name: "not-to-test",
      severity: "error",
      comment: "Production code should never import test code",
      from: {
        pathNot: "\\.(test|spec)\\.(ts|js)$",
      },
      to: {
        path: "\\.(test|spec)\\.(ts|js)$",
      },
    },
    {
      name: "not-to-dev-dep",
      severity: "error",
      comment: "Production code should not import devDependencies",
      from: {
        path: "^src",
        pathNot: "\\.(test|spec)\\.(ts|js)$",
      },
      to: {
        dependencyTypes: ["npm-dev"],
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "./tsconfig.json",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/(@[^/]+/[^/]+|[^/]+)",
      },
      text: {
        highlightFocused: true,
      },
    },
  },
};
```

---

## Phase 2: Hook Enhancement

### 2.1 Pre-Push Hook

**File**: `.husky/pre-push`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Skip in CI environments
[ -n "$CI" ] && exit 0

echo "🔍 Running pre-push verification..."

# Run full verification (must match CI)
npm run verify

# Run security audit
npm audit --audit-level=high

# Run dependency-cruiser for circular dependency check
npm run deps:check

echo "✅ Pre-push checks passed"
```

### 2.2 Enhanced Pre-Commit Hook

**File**: `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Skip in CI environments
[ -n "$CI" ] && exit 0

# Run lint-staged (format + lint staged files)
npx lint-staged

# Quick typecheck (errors only, no emit)
npm run typecheck
```

### 2.3 Updated lint-staged Configuration

**File**: `package.json` - lint-staged section

```json
{
  "lint-staged": {
    "*.{js,cjs,mjs,ts,cts,mts}": [
      "prettier --write",
      "eslint --fix --max-warnings=0"
    ],
    "*.{json,md}": ["prettier --write"],
    "*.{yml,yaml}": ["prettier --write", "eslint --fix"]
  }
}
```

---

## Phase 3: Unified Command Interface

### 3.1 Standardized npm Scripts

All consuming repositories MUST use these exact commands for consistency:

**File**: `package.json` - scripts section

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "npm run validate:schema && tsx scripts/build.ts && tsup",
    "start": "node dist/index.js",

    "format": "prettier . --write",
    "format:check": "prettier . --check",

    "lint": "eslint . --max-warnings=0",
    "lint:fix": "eslint . --fix --max-warnings=0",

    "typecheck": "tsc --noEmit",

    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",

    "security": "npm audit --audit-level=high",
    "security:fix": "npm audit fix",

    "deps:check": "dependency-cruiser src --config .dependency-cruiser.cjs",
    "deps:graph": "dependency-cruiser src --config .dependency-cruiser.cjs --output-type dot | dot -T svg > dependency-graph.svg",

    "validate:schema": "tsx scripts/validate-schema.ts",
    "sync:version": "node scripts/sync-schema-version-pretest.cjs",

    "check": "npm run lint && npm run typecheck && npm run format:check",
    "verify": "npm run check && npm run test && npm run security && npm run deps:check && npm run build",
    "ci": "npm run verify",

    "prepare": "husky"
  }
}
```

### 3.2 Command Parity Matrix

| Stage     | Hook       | CI  | Command                |
| --------- | ---------- | --- | ---------------------- |
| Format    | pre-commit | ✅  | `npm run format:check` |
| Lint      | pre-commit | ✅  | `npm run lint`         |
| Typecheck | pre-commit | ✅  | `npm run typecheck`    |
| Test      | pre-push   | ✅  | `npm run test`         |
| Security  | pre-push   | ✅  | `npm run security`     |
| Deps      | pre-push   | ✅  | `npm run deps:check`   |
| Build     | pre-push   | ✅  | `npm run build`        |

---

## Phase 4: Enhanced CI Pipeline

### 4.1 Updated CI Workflow

**File**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  security-events: write

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: CRLF Detection
        run: |
          echo "Checking for CRLF in source files..."
          if git ls-files --eol | grep -E 'w/crlf.*\.(sh|ts|js|mjs|cjs|yml|yaml)$'; then
            echo "ERROR: CRLF line endings detected"
            exit 1
          fi
          echo "✅ No CRLF issues found"

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Format check
        run: npm run format:check

      - name: Lint (zero warnings)
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Security audit
        run: npm run security

      - name: Dependency architecture check
        run: npm run deps:check

      - name: Sync version
        run: npm run sync:version

      - name: Test with coverage
        run: npm run test:coverage

      - name: Verify coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          echo "Coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "ERROR: Coverage below 80% threshold"
            exit 1
          fi

      - name: Build
        run: npm run build

      - name: Verify package entry point
        run: |
          npm pack --dry-run
          node -e "import('@oddessentials/repo-standards').then(m => console.log('✅ Loaded:', Object.keys(m)))"

      - name: Deterministic build check
        run: |
          cp -r dist dist-first
          rm -rf dist
          npm run build
          diff -r dist-first dist || { echo "ERROR: Build is not deterministic"; exit 1; }

  security-scan:
    runs-on: ubuntu-latest
    needs: ci

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/typescript
        env:
          SEMGREP_RULES: "p/security-audit p/secrets p/typescript"
```

### 4.2 Release Workflow Enhancements

**File**: `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  issues: write
  pull-requests: write
  id-token: write

jobs:
  release:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: npm
          registry-url: "https://registry.npmjs.org"

      - name: Install dependencies
        run: npm ci

      - name: Verify build (full CI)
        run: npm run verify

      - name: Configure npm provenance
        run: npm config set provenance true

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN_ODDESSENTIALS }}
          HUSKY: "0"
        run: npx semantic-release
```

---

## Phase 5: AI Governance & Invariants

### 5.1 AI Invariants (Embedded in Spec)

Add to `config/standards.json` in the `meta` section:

```json
{
  "meta": {
    "aiGovernance": {
      "version": 1,
      "invariants": [
        {
          "id": "AI-INV-001",
          "title": "Never modify .env files",
          "description": "AI agents must never read, write, or modify .env files or any file containing secrets",
          "enforcement": "required",
          "severity": "error",
          "verification": "git diff --cached --name-only | grep -E '^\\.env' && exit 1 || exit 0"
        },
        {
          "id": "AI-INV-002",
          "title": "Never push to main branch",
          "description": "AI agents must never commit directly to main/master branches",
          "enforcement": "required",
          "severity": "error",
          "verification": "git branch --show-current | grep -E '^(main|master)$' && exit 1 || exit 0"
        },
        {
          "id": "AI-INV-003",
          "title": "Never skip tests without explicit approval",
          "description": "AI agents must stop and explain before skipping any test",
          "enforcement": "required",
          "severity": "error"
        },
        {
          "id": "AI-INV-004",
          "title": "Fix test failures at root cause",
          "description": "Test failures must be fixed by addressing the root cause, not by modifying or disabling tests",
          "enforcement": "required",
          "severity": "error"
        },
        {
          "id": "AI-INV-005",
          "title": "Enterprise-grade quality always",
          "description": "All work must meet enterprise-grade standards regardless of time constraints",
          "enforcement": "required",
          "severity": "error"
        }
      ],
      "protectedPatterns": [
        ".env",
        ".env.*",
        "*.pem",
        "*.key",
        "credentials.*",
        "secrets.*"
      ],
      "protectedBranches": ["main", "master", "release/*", "production"]
    }
  }
}
```

### 5.2 Agent Documentation Prompt

Add to `templates/AGENT-PROMPT.md`:

````markdown
# Agent Instructions

This must be done professionally with enterprise-grade best practices at the forefront.
Take your time and do the work correctly. Plan as needed so that we are efficient.

## Before Starting

1. Carefully review the `/docs`, tests, and code to gain a full understanding of this code repository
2. Run `npm run verify` to ensure the repository is in a clean state
3. Review `INVARIANTS.md` for rules that must never be violated

## During Implementation

1. Create an implementation plan for all items before coding
2. Commit each phase to the current branch after ensuring all CI and quality checks pass
3. If you encounter failures, they must be fixed in a professional, enterprise-grade fashion whether or not they were pre-existing

## Critical Rules

- **NEVER** modify `.env` files or any file containing secrets
- **NEVER** commit or push directly to `main` or `master` branches
- **NEVER** skip tests without stopping, asking, and clearly explaining why
- **ALWAYS** fix test failures by addressing the root cause (never modify tests to pass)
- **ALWAYS** treat all work as enterprise-grade regardless of time constraints
- **ALWAYS** ensure lint warnings and typing issues are errors from the beginning (warnings only for pre-existing legacy issues)

## Quality Gates

Before completing any task:

```bash
npm run verify  # Must pass completely
```
````

This runs:

- Format check
- Lint (zero warnings)
- Type check
- Tests
- Security audit
- Dependency architecture check
- Build

````

### 5.3 Pre-Commit Hook Enhancement for AI Safety

**File**: `.husky/pre-commit` - Additional checks

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

[ -n "$CI" ] && exit 0

# AI Safety: Block commits to protected branches
BRANCH=$(git branch --show-current)
if echo "$BRANCH" | grep -qE "^(main|master|release/|production)$"; then
  echo "❌ ERROR: Direct commits to $BRANCH are not allowed"
  echo "Create a feature branch and submit a pull request instead."
  exit 1
fi

# AI Safety: Block .env file modifications
if git diff --cached --name-only | grep -qE '(^\.env|\.env\.|credentials\.|secrets\.|\.pem$|\.key$)'; then
  echo "❌ ERROR: Attempted to commit sensitive files"
  echo "The following files are protected and cannot be committed:"
  git diff --cached --name-only | grep -E '(^\.env|\.env\.|credentials\.|secrets\.|\.pem$|\.key$)'
  exit 1
fi

npx lint-staged
npm run typecheck
````

---

## Phase 6: README Enhancement

### 6.1 Badge Updates

Add/update badges at the top of `README.md`:

```markdown
[![npm version](https://img.shields.io/npm/v/@oddessentials/repo-standards.svg)](https://www.npmjs.com/package/@oddessentials/repo-standards)
[![npm downloads](https://img.shields.io/npm/dm/@oddessentials/repo-standards.svg)](https://www.npmjs.com/package/@oddessentials/repo-standards)
[![CI](https://github.com/oddessentials/repo-standards/actions/workflows/ci.yml/badge.svg)](https://github.com/oddessentials/repo-standards/actions/workflows/ci.yml)
[![Release](https://github.com/oddessentials/repo-standards/actions/workflows/release.yml/badge.svg)](https://github.com/oddessentials/repo-standards/actions/workflows/release.yml)
[![codecov](https://codecov.io/gh/oddessentials/repo-standards/branch/main/graph/badge.svg)](https://codecov.io/gh/oddessentials/repo-standards)
[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)
[![semantic-release](https://img.shields.io/badge/semantic--release-24-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![license](https://img.shields.io/npm/l/@oddessentials/repo-standards.svg)](LICENSE)
[![node](https://img.shields.io/node/v/@oddessentials/repo-standards.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)
[![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3.svg)](https://eslint.org/)
[![Security: Semgrep](https://img.shields.io/badge/security-semgrep-green.svg)](https://semgrep.dev/)
```

### 6.2 Developer Setup Section

Add to `README.md`:

````markdown
## Developer Setup

### Prerequisites

1. **Node Version Manager** (required)
   - [NVM](https://github.com/nvm-sh/nvm) (macOS/Linux)
   - [nvm-windows](https://github.com/coreybutler/nvm-windows) (Windows)
   - [VersionFox](https://github.com/version-fox/vfox) (cross-platform alternative)

2. **Python** (required for some tooling)
   - Ensure Python 3.x is available on PATH
   - Required for: gyp, node-sass, and native module compilation

3. **Line Endings** (critical for cross-platform)
   - This repository enforces LF line endings via `.gitattributes`
   - Windows users: Git will auto-convert on checkout (CRLF → LF)
   - Run `git config core.autocrlf input` if issues persist

### Quick Start

```bash
# Use correct Node version (from .nvmrc)
nvm use

# Install dependencies
npm ci

# Run verification (should pass before any work)
npm run verify
```
````

### Automated Hooks

Git hooks are installed automatically via Husky:

| Hook         | What It Does                                     | Skip Condition |
| ------------ | ------------------------------------------------ | -------------- |
| `pre-commit` | Format + Lint + Typecheck staged files           | CI environment |
| `commit-msg` | Validate conventional commit message             | CI environment |
| `pre-push`   | Full verification (tests, security, deps, build) | CI environment |

### Manual Commands

| Command                 | Purpose                         |
| ----------------------- | ------------------------------- |
| `npm run format`        | Format all files with Prettier  |
| `npm run check`         | Lint + Typecheck + Format check |
| `npm run verify`        | Full CI verification locally    |
| `npm run test`          | Run tests                       |
| `npm run test:coverage` | Run tests with coverage report  |

### Troubleshooting

**"CRLF detected" errors**

```bash
git add --renormalize .
git commit -m "chore: normalize line endings"
```

**"Husky hooks not running"**

```bash
npm run prepare
git config core.hooksPath .husky
```

**"Cannot find module" after checkout**

```bash
rm -rf node_modules package-lock.json
npm install
```

````

---

## Phase 7: Test Coverage Enhancement

### 7.1 Coverage Configuration

**File**: `vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.test.ts",
        "**/*.spec.ts",
        "test/**",
        "vitest.config.ts",
        "tsup.config.ts",
        "eslint.config.mjs",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
````

### 7.2 Additional Test Cases Required

Create tests for:

- All exported API functions
- CLI argument parsing
- Schema validation edge cases
- Error handling paths
- Generated artifact determinism

---

## Phase 8: Security Hardening

### 8.1 npm Audit Configuration

Add to `package.json`:

```json
{
  "overrides": {
    "// Comment": "Add security overrides here for known safe vulnerabilities"
  }
}
```

### 8.2 Semgrep Configuration

**File**: `.semgrep.yml`

```yaml
rules:
  - id: no-hardcoded-secrets
    patterns:
      - pattern-either:
          - pattern: $KEY = "..."
          - pattern: $KEY = '...'
    message: Potential hardcoded secret detected
    languages: [typescript, javascript]
    severity: ERROR

  - id: no-eval
    pattern: eval(...)
    message: eval() is dangerous and should not be used
    languages: [typescript, javascript]
    severity: ERROR

  - id: no-unsafe-regex
    pattern-regex: /\.\*\+|\.\+\*/
    message: Potentially unsafe regex that could cause ReDoS
    languages: [typescript, javascript]
    severity: WARNING
```

---

## Phase 9: Schema Updates for v7

### 9.1 Version Bump

Update `config/standards.json`:

```json
{
  "version": 7,
  "meta": {
    "schemaVersion": 7,
    "defaultCoverageThreshold": 0.8,
    "complexityChecks": {
      "enabledByDefault": true,
      "maxComplexity": 15,
      "enforcement": "error"
    },
    "qualityGatePolicy": {
      "preferSoftFailOnLegacy": true,
      "hardFailOnNew": true,
      "zeroToleranceForRegression": true
    },
    "aiGovernance": {
      /* ... as defined above ... */
    },
    "migrationGuide": [
      /* ... updated steps ... */
    ]
  }
}
```

### 9.2 New Checklist Items

Add to `checklist.core`:

```json
{
  "id": "yaml-linting",
  "label": "YAML Linting",
  "description": "All YAML/YML files must pass linting (valid syntax, consistent formatting)",
  "enforcement": "required",
  "severity": "error",
  "appliesTo": { "stacks": ["typescript-js", "python", "csharp-dotnet", "rust", "go"] },
  "stackHints": {
    "typescript-js": {
      "exampleTools": ["eslint-plugin-yml", "yamllint"],
      "exampleConfigFiles": ["eslint.config.mjs"],
      "verification": "npm run lint"
    }
  }
},
{
  "id": "circular-dependency-prevention",
  "label": "Circular Dependency Prevention",
  "description": "Circular dependencies must be detected and prevented via static analysis",
  "enforcement": "required",
  "severity": "error",
  "appliesTo": { "stacks": ["typescript-js"] },
  "stackHints": {
    "typescript-js": {
      "exampleTools": ["dependency-cruiser", "madge"],
      "exampleConfigFiles": [".dependency-cruiser.cjs"],
      "verification": "npm run deps:check"
    }
  }
},
{
  "id": "no-explicit-any",
  "label": "No Explicit Any Type",
  "description": "The 'any' type must not be used except in critical cases with justification",
  "enforcement": "required",
  "severity": "error",
  "appliesTo": { "stacks": ["typescript-js"] },
  "stackHints": {
    "typescript-js": {
      "exampleTools": ["@typescript-eslint/no-explicit-any"],
      "notes": "Use 'unknown' with type guards instead of 'any'"
    }
  }
},
{
  "id": "security-scanning-advanced",
  "label": "Advanced Security Scanning",
  "description": "SAST scanning beyond npm audit (e.g., semgrep)",
  "enforcement": "required",
  "severity": "error",
  "appliesTo": { "stacks": ["typescript-js", "python"] },
  "ciHints": {
    "github-actions": {
      "stage": "test",
      "job": "security-scan",
      "notes": "Run semgrep with security-audit and secrets rulesets"
    }
  }
}
```

---

## Phase 10: Migration Checklist for Consumers

### 10.1 Breaking Changes Summary

| Change                               | v6 Behavior | v7 Behavior    | Migration                                  |
| ------------------------------------ | ----------- | -------------- | ------------------------------------------ |
| `@typescript-eslint/no-explicit-any` | warn        | error          | Replace `any` with `unknown` + type guards |
| `complexity`                         | warn @ 20   | error @ 15     | Refactor complex functions                 |
| Pre-push hook                        | none        | full verify    | Ensure `npm run verify` passes locally     |
| YAML linting                         | none        | required       | Add `eslint-plugin-yml`                    |
| Dependency-cruiser                   | none        | required       | Add `.dependency-cruiser.cjs`              |
| Coverage threshold                   | advisory    | enforced @ 80% | Add tests to meet threshold                |
| Semgrep                              | none        | required in CI | Add semgrep workflow step                  |

### 10.2 Consumer Migration Steps

1. **Update dependencies**

   ```bash
   npm install @oddessentials/repo-standards@7
   npm install -D eslint-plugin-yml dependency-cruiser @vitest/coverage-v8
   ```

2. **Update TypeScript config** (copy strict settings)

3. **Update ESLint config** (enable type-aware rules)

4. **Add dependency-cruiser config** (copy `.dependency-cruiser.cjs`)

5. **Add pre-push hook** (copy `.husky/pre-push`)

6. **Update CI workflow** (add security scan job)

7. **Fix any violations**

   ```bash
   npm run verify  # Fix all errors before proceeding
   ```

8. **Commit with breaking change**

   ```bash
   git commit -m "feat!: upgrade to repo-standards v7

   BREAKING CHANGE: Strict type checking and zero-tolerance enforcement now required"
   ```

---

## Implementation Timeline

### Phase Execution Order

| Phase | Description          | Dependencies | Estimated Effort                |
| ----- | -------------------- | ------------ | ------------------------------- |
| 1     | Foundation Hardening | None         | TypeScript + ESLint updates     |
| 2     | Hook Enhancement     | Phase 1      | Add pre-push hook               |
| 3     | Unified Commands     | Phase 1      | Standardize scripts             |
| 4     | CI Pipeline          | Phase 1-3    | Update workflows                |
| 5     | AI Governance        | Phase 1-4    | Add invariants to spec          |
| 6     | README Enhancement   | Phase 1-5    | Documentation update            |
| 7     | Test Coverage        | Phase 1-4    | Add tests, configure thresholds |
| 8     | Security Hardening   | Phase 4      | Add semgrep                     |
| 9     | Schema Updates       | Phase 1-8    | Bump to v7                      |
| 10    | Migration Docs       | Phase 1-9    | Document breaking changes       |

---

## TODO Items (Incomplete/Future)

- [ ] **Semgrep custom rules**: Develop org-specific security rules
- [ ] **Codecov integration**: Upload coverage reports to codecov.io (free for open source)
- [ ] **Dependabot fallback**: Document Dependabot config for GitHub-only consumers
- [ ] **GitLab CI support**: Add `.gitlab-ci.yml` template
- [ ] **Monorepo support**: Add guidance for Nx/Turborepo consumers
- [ ] **VSCode settings**: Add recommended extensions and settings
- [ ] **EditorConfig**: Add `.editorconfig` for editor-agnostic formatting hints

---

## Validation Checklist

Before releasing v7, ensure ALL items pass:

- [ ] `npm run verify` passes with zero warnings
- [ ] All new ESLint rules pass on existing codebase (or legacy files excluded)
- [ ] Pre-push hook runs `npm run verify` successfully
- [ ] CI pipeline includes all new checks
- [ ] Coverage threshold enforced at 80%
- [ ] Semgrep runs without critical findings
- [ ] Dependency-cruiser reports no circular dependencies
- [ ] README includes complete developer setup instructions
- [ ] CHANGELOG documents all breaking changes
- [ ] Schema version bumped to 7
- [ ] All AI invariants documented in spec

---

## References

- [ESLint v9 Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [Dependency-Cruiser Documentation](https://github.com/sverweij/dependency-cruiser)
- [Semgrep Rules Registry](https://semgrep.dev/r)
- [Vitest Coverage](https://vitest.dev/guide/coverage.html)
- [Husky v9](https://typicode.github.io/husky/)
- [Conventional Commits](https://www.conventionalcommits.org/)
