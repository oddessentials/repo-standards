# @oddessentials/repo-standards v7.0.0 Implementation Plan

> **BREAKING CHANGE**: This major version introduces comprehensive quality gates, AI agent safety invariants, and enterprise-grade tooling standards. All downstream consumers must update their configurations.

---

## Executive Summary

This implementation plan addresses critical issues identified by downstream consumers and establishes enterprise-grade best practices for repository quality standards. Version 7.0.0 represents a paradigm shift toward stricter enforcement, AI agent safety, and comprehensive automation.

---

## Table of Contents

1. [Phase 1: Foundation & Dependencies](#phase-1-foundation--dependencies)
2. [Phase 2: Strict Typing & Linting](#phase-2-strict-typing--linting)
3. [Phase 3: Commit & Release Automation](#phase-3-commit--release-automation)
4. [Phase 4: Git Hooks & Pre-commit/Pre-push](#phase-4-git-hooks--pre-commitpre-push)
5. [Phase 5: CI/CD Pipeline Hardening](#phase-5-cicd-pipeline-hardening)
6. [Phase 6: Security Scanning](#phase-6-security-scanning)
7. [Phase 7: Code Complexity & Architecture](#phase-7-code-complexity--architecture)
8. [Phase 8: AI Agent Safety Invariants](#phase-8-ai-agent-safety-invariants)
9. [Phase 9: Cross-Platform Compatibility](#phase-9-cross-platform-compatibility)
10. [Phase 10: Documentation & README](#phase-10-documentation--readme)
11. [Phase 11: Test Coverage & Quality](#phase-11-test-coverage--quality)
12. [Agent Instructions](#agent-instructions)
13. [Human Developer Requirements](#human-developer-requirements)

---

## Phase 1: Foundation & Dependencies

### Objectives

- Update all 3rd party dependencies to latest stable versions
- Establish dependency governance with automated updates
- Configure zero-tolerance for security vulnerabilities

### Tasks

#### 1.1 Update Dependencies

```bash
# Update all dependencies to latest
npm update
npm audit fix

# Check for outdated packages
npm outdated

# Update major versions manually after review
npx npm-check-updates -u
npm install
```

#### 1.2 Configure Renovate for Automated Updates

Update `renovate.json`:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:recommended",
    ":semanticCommits",
    ":preserveSemverRanges",
    "group:allNonMajor",
    "schedule:weekly"
  ],
  "labels": ["dependencies"],
  "automerge": true,
  "automergeType": "pr",
  "platformAutomerge": true,
  "prHourlyLimit": 4,
  "prConcurrentLimit": 10,
  "vulnerabilityAlerts": {
    "enabled": true,
    "labels": ["security"]
  },
  "packageRules": [
    {
      "matchUpdateTypes": ["patch", "minor"],
      "automerge": true
    },
    {
      "matchUpdateTypes": ["major"],
      "automerge": false,
      "labels": ["breaking-change"]
    }
  ],
  "schedule": ["after 6am and before 9am on Monday"]
}
```

#### 1.3 Update package.json Engine Requirements

```json
{
  "engines": {
    "node": ">=22.0.0",
    "npm": ">=10.0.0"
  },
  "packageManager": "npm@10.8.0"
}
```

#### 1.4 Update .nvmrc

```
22
```

### Deliverables

- [ ] All dependencies updated to latest stable versions
- [ ] `renovate.json` configured for weekly automated updates
- [ ] Security vulnerabilities addressed (npm audit clean)
- [ ] Node.js 22 LTS requirement enforced

---

## Phase 2: Strict Typing & Linting

### Objectives

- Enforce strict TypeScript compilation
- Configure ESLint for zero-tolerance warnings (new code)
- Add YAML linting as required tooling
- Eliminate `any` type usage

### Tasks

#### 2.1 Strict TypeScript Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

#### 2.2 ESLint Configuration (Flat Config)

Update `eslint.config.mjs`:

```javascript
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Strict typing - no any allowed
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unsafe-argument": "error",

      // Strict function signatures
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",

      // Code quality
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",

      // Import rules
      "no-duplicate-imports": "error",
      "sort-imports": ["error", { ignoreDeclarationSort: true }],
    },
  },
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.cjs",
    ],
  },
);
```

#### 2.3 Add YAML Linting

Install yamllint and create configuration:

Create `.yamllint.yml`:

```yaml
extends: default

rules:
  document-end: disable
  document-start: disable
  line-length:
    max: 120
    level: warning
  truthy:
    allowed-values: ["true", "false", "on", "off", "yes", "no"]
    check-keys: false
  indentation:
    spaces: 2
    indent-sequences: true
  comments:
    require-starting-space: true
    min-spaces-from-content: 1
  brackets:
    min-spaces-inside: 0
    max-spaces-inside: 0
  braces:
    min-spaces-inside: 0
    max-spaces-inside: 0
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "lint:yaml": "yamllint ."
  }
}
```

### Deliverables

- [ ] `tsconfig.json` with all strict options enabled
- [ ] ESLint configured with strict TypeScript rules
- [ ] `any` type usage produces errors
- [ ] YAML linting configured and integrated
- [ ] All existing type errors documented or fixed

---

## Phase 3: Commit & Release Automation

### Objectives

- Enforce conventional commits with commitlint
- Configure semantic-release for automated changelog
- Establish BREAKING CHANGE workflow

### Tasks

#### 3.1 Commitlint Configuration

Update `commitlint.config.js`:

```javascript
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
        "security",
      ],
    ],
    "scope-enum": [
      2,
      "always",
      [
        "core",
        "config",
        "generator",
        "templates",
        "scripts",
        "ci",
        "deps",
        "docs",
        "security",
        "tests",
      ],
    ],
    "subject-case": [2, "always", "lower-case"],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "body-max-line-length": [2, "always", 200],
    "footer-max-line-length": [2, "always", 200],
  },
};
```

#### 3.2 Semantic Release Configuration

Update `.releaserc.json`:

```json
{
  "branches": [
    "main",
    {
      "name": "beta",
      "prerelease": true
    },
    {
      "name": "alpha",
      "prerelease": true
    }
  ],
  "plugins": [
    [
      "@semantic-release/commit-analyzer",
      {
        "preset": "conventionalcommits",
        "releaseRules": [
          { "type": "feat", "release": "minor" },
          { "type": "fix", "release": "patch" },
          { "type": "perf", "release": "patch" },
          { "type": "security", "release": "patch" },
          { "type": "docs", "scope": "README", "release": "patch" },
          { "type": "refactor", "release": "patch" },
          { "breaking": true, "release": "major" }
        ]
      }
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        "preset": "conventionalcommits",
        "presetConfig": {
          "types": [
            { "type": "feat", "section": "✨ Features" },
            { "type": "fix", "section": "🐛 Bug Fixes" },
            { "type": "perf", "section": "⚡ Performance" },
            { "type": "security", "section": "🔒 Security" },
            { "type": "docs", "section": "📚 Documentation" },
            { "type": "refactor", "section": "♻️ Refactoring" },
            { "type": "test", "section": "✅ Tests" },
            { "type": "build", "section": "🏗️ Build" },
            { "type": "ci", "section": "👷 CI/CD" }
          ]
        }
      }
    ],
    [
      "@semantic-release/changelog",
      {
        "changelogFile": "CHANGELOG.md",
        "changelogTitle": "# Changelog\n\nAll notable changes to this project will be documented in this file."
      }
    ],
    [
      "@semantic-release/npm",
      {
        "npmPublish": true
      }
    ],
    [
      "@semantic-release/git",
      {
        "assets": [
          "CHANGELOG.md",
          "package.json",
          "package-lock.json",
          "config/standards.json"
        ],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    "@semantic-release/github"
  ]
}
```

### Deliverables

- [ ] Commitlint enforcing conventional commits
- [ ] Semantic-release auto-generating CHANGELOG.md
- [ ] Version sync with standards.json schema
- [ ] GitHub releases created automatically

---

## Phase 4: Git Hooks & Pre-commit/Pre-push

### Objectives

- Automate formatting on pre-commit
- Run tests on pre-push
- Mirror CI checks locally
- Minimize manual developer effort

### Tasks

#### 4.1 Husky Configuration

Initialize husky:

```bash
npm install -D husky lint-staged
npx husky init
```

#### 4.2 Pre-commit Hook

Create `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged for formatting and linting
npx lint-staged

# Run commitlint on the commit message
npx --no -- commitlint --edit ${1}
```

#### 4.3 Commit-msg Hook

Create `.husky/commit-msg`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit ${1}
```

#### 4.4 Pre-push Hook

Create `.husky/pre-push`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-push checks..."

# Type checking
echo "📝 Type checking..."
npm run typecheck

# Linting
echo "🧹 Linting..."
npm run lint

# YAML Linting
echo "📄 YAML Linting..."
npm run lint:yaml

# Tests
echo "🧪 Running tests..."
npm run test

# Security audit
echo "🔒 Security audit..."
npm audit --audit-level=high

# Dependency cruiser (circular dependency check)
echo "🔄 Checking for circular dependencies..."
npm run check:circular

echo "✅ All pre-push checks passed!"
```

#### 4.5 Lint-staged Configuration

Add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx,mjs,cjs}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"],
    "*.{yml,yaml}": ["yamllint"]
  }
}
```

#### 4.6 Standardized npm Scripts

Update `package.json` scripts:

```json
{
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",

    "format": "prettier --write .",
    "format:check": "prettier --check .",

    "lint": "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix",
    "lint:yaml": "yamllint .",

    "typecheck": "tsc --noEmit",

    "check": "npm run format:check && npm run lint && npm run typecheck && npm run lint:yaml",
    "check:circular": "depcruise src --config .dependency-cruiser.cjs",
    "check:security": "npm audit --audit-level=high",

    "verify": "npm run check && npm run test && npm run check:security && npm run check:circular",

    "generate:ci": "node scripts/generate-ci.js",
    "generate:instructions": "node scripts/generate-instructions.js",

    "prepare": "husky",
    "prepublishOnly": "npm run verify && npm run build"
  }
}
```

### Deliverables

- [ ] Pre-commit: formatting, linting, commit message validation
- [ ] Pre-push: typecheck, lint, tests, security, circular deps
- [ ] Lint-staged for staged files only
- [ ] Standardized script naming: `format`, `check`, `verify`

---

## Phase 5: CI/CD Pipeline Hardening

### Objectives

- Match CI to local pre-push checks
- Add all quality gates before merge
- Separate stages for clarity

### Tasks

#### 5.1 Main CI Workflow

Update `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, beta, alpha]
  pull_request:
    branches: [main]

permissions:
  contents: read
  security-events: write

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # Stage 1: Quick checks
  lint:
    name: Lint & Format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Check formatting
        run: npm run format:check

      - name: Run ESLint
        run: npm run lint

      - name: YAML Lint
        run: npm run lint:yaml

  typecheck:
    name: TypeScript Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

  # Stage 2: Architecture & Security
  architecture:
    name: Architecture Checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Check circular dependencies
        run: npm run check:circular

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: npm audit
        run: npm audit --audit-level=high

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/default
            p/security-audit
            p/secrets
            p/typescript
        env:
          SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}

  # Stage 3: Tests
  test:
    name: Tests
    runs-on: ubuntu-latest
    needs: [lint, typecheck]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  # Stage 4: Build
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test, architecture, security]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7

  # Final gate
  ci-success:
    name: CI Success
    runs-on: ubuntu-latest
    needs: [build]
    if: always()
    steps:
      - name: Check all jobs
        run: |
          if [[ "${{ needs.build.result }}" != "success" ]]; then
            echo "Build failed"
            exit 1
          fi
          echo "All CI checks passed!"
```

#### 5.2 Release Workflow

Update `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    branches: [main, beta, alpha]
  workflow_dispatch:

permissions:
  contents: write
  issues: write
  pull-requests: write
  id-token: write

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: "npm"
          registry-url: "https://registry.npmjs.org"

      - name: Install dependencies
        run: npm ci

      - name: Verify build
        run: npm run verify

      - name: Build
        run: npm run build

      - name: Sync standards version
        run: node scripts/sync-standards-version.cjs

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          HUSKY: 0
        run: npx semantic-release
```

### Deliverables

- [ ] CI workflow with lint, typecheck, architecture, security, test, build stages
- [ ] All stages must pass before merge to main
- [ ] Concurrency management for PR efficiency
- [ ] Coverage reporting to Codecov
- [ ] Semantic-release for automated publishing

---

## Phase 6: Security Scanning

### Objectives

- Basic security with npm audit
- Advanced SAST with Semgrep
- Dependency vulnerability scanning

### Tasks

#### 6.1 Semgrep Integration

Already included in CI workflow above.

Create `.semgrepignore`:

```
node_modules/
dist/
coverage/
*.test.ts
*.spec.ts
```

#### 6.2 Security Policy

Create `SECURITY.md`:

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 7.x.x   | :white_check_mark: |
| 6.x.x   | :white_check_mark: |
| < 6.0   | :x:                |

## Reporting a Vulnerability

Please report security vulnerabilities by emailing security@oddessentials.com.

Do NOT create public GitHub issues for security vulnerabilities.

We will acknowledge receipt within 48 hours and provide a detailed response
within 7 days indicating next steps.

## Security Measures

This repository implements:

- npm audit on every push and PR
- Semgrep SAST scanning
- Renovate for automated dependency updates
- Strict TypeScript compilation
- Pre-commit and pre-push security checks
```

### Deliverables

- [ ] npm audit in CI (high severity fails)
- [ ] Semgrep SAST scanning
- [ ] Security policy documented
- [ ] Dependency updates automated

---

## Phase 7: Code Complexity & Architecture

### Objectives

- Prevent circular dependencies
- Encourage shift-left refactoring
- Enforce architectural boundaries

### Tasks

#### 7.1 Dependency Cruiser Configuration

Create `.dependency-cruiser.cjs`:

```javascript
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular dependencies are forbidden",
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: "no-orphans",
      severity: "warn",
      comment: "Orphan modules should be removed or connected",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$",
          "\\.d\\.ts$",
          "(^|/)tsconfig\\.json$",
          "(^|/)(babel|webpack)\\.config\\.(js|cjs|mjs|ts|json)$",
          "__tests__",
          "__mocks__",
          "\\.test\\.",
          "\\.spec\\.",
        ],
      },
      to: {},
    },
    {
      name: "no-deprecated-core",
      severity: "warn",
      comment: "Deprecated core modules should not be used",
      from: {},
      to: {
        dependencyTypes: ["core"],
        path: ["^(punycode|domain|constants|sys|_linklist|_stream_wrap)$"],
      },
    },
    {
      name: "not-to-dev-dep",
      severity: "error",
      comment: "Production code should not import dev dependencies",
      from: {
        path: "^(src)",
        pathNot: "\\.(spec|test)\\.(js|mjs|cjs|ts|tsx)$",
      },
      to: {
        dependencyTypes: ["npm-dev"],
      },
    },
    {
      name: "not-to-test",
      severity: "error",
      comment: "Production code should not import test files",
      from: {
        path: "^(src)",
        pathNot: "\\.(spec|test)\\.(js|mjs|cjs|ts|tsx)$",
      },
      to: {
        path: "\\.(spec|test)\\.(js|mjs|cjs|ts|tsx)$",
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    tsConfig: {
      fileName: "tsconfig.json",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/[^/]+",
      },
      archi: {
        collapsePattern: "^(node_modules|packages|src|lib|app|test)/",
      },
      text: {
        highlightFocused: true,
      },
    },
  },
};
```

#### 7.2 ESLint Import Cycle Detection

Add to eslint config:

```javascript
import importPlugin from 'eslint-plugin-import';

// In rules:
{
  'import/no-cycle': ['error', { maxDepth: '∞' }],
  'import/no-self-import': 'error',
  'import/no-useless-path-segments': 'error',
}
```

### Deliverables

- [ ] Dependency cruiser blocking circular dependencies
- [ ] Orphan module detection
- [ ] Production/dev dependency separation enforced
- [ ] Architecture visualization available

---

## Phase 8: AI Agent Safety Invariants

### Objectives

- Prevent AI agents from touching .env files
- Prevent AI agents from committing to main
- Establish professional enterprise standards
- Enforce test quality standards

### Tasks

#### 8.1 Update AGENT-SAFETY.md

```markdown
# AI Agent Safety Invariants

> **CRITICAL**: These rules are NON-NEGOTIABLE for all AI agents operating in this repository
> or any downstream consumer repositories.

## Core Invariants

### 1. Environment Files are SACRED
```

INVARIANT: AI agents MUST NEVER read, write, modify, or delete .env files

```
- `.env`, `.env.local`, `.env.development`, `.env.production`, `.env.test`
- All files matching pattern `*.env*` or `.env*`
- Environment configuration in any form

**Rationale**: Environment files contain secrets, API keys, and sensitive configuration
that could be leaked or corrupted.

### 2. Main Branch is PROTECTED
```

INVARIANT: AI agents MUST NEVER commit or push directly to the main branch

```
- All changes MUST go through pull requests
- AI commits MUST be to feature branches only
- Branch naming: `ai/<type>/<description>` (e.g., `ai/feat/add-yaml-linting`)

**Rationale**: Direct commits to main bypass code review, CI checks, and could
introduce breaking changes or security vulnerabilities.

### 3. Professional Standards are MANDATORY
```

INVARIANT: AI agents MUST treat all work as enterprise-grade production code

```
- No shortcuts due to "time constraints"
- No skipping tests "to save time"
- No "quick fixes" that compromise quality
- No technical debt without explicit approval

### 4. Tests are SACROSANCT
```

INVARIANT: AI agents MUST fix tests based on root cause analysis

```
- NEVER skip tests without explicit human approval
- NEVER delete failing tests to "fix" CI
- ALWAYS increase test coverage, never decrease
- ALWAYS identify and fix the root cause, not symptoms

**When encountering a test failure, the AI MUST:**
1. STOP immediately
2. Analyze the root cause
3. Document findings clearly
4. Ask for human guidance if uncertain
5. Fix the underlying issue, not the test

### 5. Warnings Become Errors
```

INVARIANT: For new repositories, lint warnings and typing issues MUST fail builds

````
- Warnings are ONLY for pre-existing issues in legacy code
- New code MUST have zero warnings
- All strict TypeScript options MUST be enabled
- ESLint `--max-warnings 0` for all new code

## Implementation Checklist

All downstream consumers MUST implement:

- [ ] `.gitignore` explicitly excludes all `.env*` patterns
- [ ] Branch protection rules on `main` requiring PR reviews
- [ ] Pre-push hooks checking current branch is not `main`
- [ ] CI failing on any warning (for new repos)
- [ ] Test coverage gates (minimum 80%)

## Pre-Push Branch Check

Add to `.husky/pre-push`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# AI SAFETY: Prevent pushes to main branch
current_branch=$(git symbolic-ref HEAD 2>/dev/null | sed 's|refs/heads/||')
if [ "$current_branch" = "main" ]; then
  echo "❌ ERROR: Direct pushes to main branch are forbidden."
  echo "   Please create a feature branch and open a pull request."
  exit 1
fi

# Continue with other checks...
````

## Agent Prompt Template

The following prompt should be included in all AI agent configurations:

```
This must be done professionally with enterprise-grade best practices at the forefront.
Take your time and do the work correctly. Plan as needed so that we are efficient.

Carefully review the /docs, tests, and code to gain a full understanding of this
code repository. Then thoroughly verify the code to create an implementation plan
for the following items.

Commit each phase to the current branch after ensuring that all CI and quality
checks pass. If you encounter failures, they must be fixed in a professional,
enterprise-grade fashion whether or not they were pre-existing.

INVARIANTS (non-negotiable):
1. NEVER touch .env files
2. NEVER commit or push to main branch
3. NEVER skip tests without stopping and asking
4. ALWAYS fix root causes, not symptoms
5. ALWAYS treat this as production-grade work
```

```

#### 8.2 Pre-push Main Branch Guard
Already included in Phase 4 pre-push hook, but emphasized here.

#### 8.3 .gitignore Updates
Ensure `.gitignore` includes:
```

# Environment files - NEVER commit these

.env
.env.local
.env.development
.env.production
.env.test
.env*.local
*.env

```

### Deliverables
- [ ] AGENT-SAFETY.md with comprehensive invariants
- [ ] Pre-push hook blocking main branch pushes
- [ ] .gitignore excluding all environment files
- [ ] Agent prompt template documented

---

## Phase 9: Cross-Platform Compatibility

### Objectives
- Eliminate line ending issues
- Ensure consistent behavior across OS

### Tasks

#### 9.1 Git Attributes
Update `.gitattributes`:
```

# Auto detect text files and perform LF normalization

- text=auto eol=lf

# Explicitly declare text files

_.ts text eol=lf
_.tsx text eol=lf
_.js text eol=lf
_.jsx text eol=lf
_.mjs text eol=lf
_.cjs text eol=lf
_.json text eol=lf
_.md text eol=lf
_.yml text eol=lf
_.yaml text eol=lf
_.html text eol=lf
_.css text eol=lf
_.scss text eol=lf
_.sh text eol=lf

# Denote all files that are truly binary and should not be modified

_.png binary
_.jpg binary
_.jpeg binary
_.gif binary
_.ico binary
_.woff binary
_.woff2 binary
_.ttf binary
_.eot binary
_.pdf binary

# Shell scripts must have LF endings

_.sh text eol=lf
.husky/_ text eol=lf

# Windows batch files need CRLF

_.bat text eol=crlf
_.cmd text eol=crlf

# Keep package-lock.json consistent

package-lock.json text eol=lf -diff

````

#### 9.2 Prettier End of Line
Update `.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "endOfLine": "lf"
}
````

#### 9.3 EditorConfig

Create/update `.editorconfig`:

```
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2

[Makefile]
indent_style = tab
```

### Deliverables

- [ ] `.gitattributes` enforcing LF line endings
- [ ] Prettier configured for LF
- [ ] EditorConfig for consistent editing
- [ ] All text files normalized to LF

---

## Phase 10: Documentation & README

### Objectives

- Enterprise-grade README with accurate badges
- Human developer prerequisites documented
- Automated badge maintenance

### Tasks

#### 10.1 README.md Overhaul

````markdown
# 🐝 @oddessentials/repo-standards

[![npm version](https://img.shields.io/npm/v/@oddessentials/repo-standards.svg)](https://www.npmjs.com/package/@oddessentials/repo-standards)
[![npm downloads](https://img.shields.io/npm/dm/@oddessentials/repo-standards.svg)](https://www.npmjs.com/package/@oddessentials/repo-standards)
[![CI](https://github.com/oddessentials/repo-standards/actions/workflows/ci.yml/badge.svg)](https://github.com/oddessentials/repo-standards/actions/workflows/ci.yml)
[![Release](https://github.com/oddessentials/repo-standards/actions/workflows/release.yml/badge.svg)](https://github.com/oddessentials/repo-standards/actions/workflows/release.yml)
[![codecov](https://codecov.io/gh/oddessentials/repo-standards/branch/main/graph/badge.svg)](https://codecov.io/gh/oddessentials/repo-standards)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Strict TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/tsconfig#strict)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![semantic-release](https://img.shields.io/badge/semantic--release-✓-brightgreen?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-≥22-green.svg)](https://nodejs.org)

A **single, authoritative JSON specification** for repository quality standards across multiple stacks (TypeScript/JS, C#/.NET, Python, Rust, and Go), plus deterministic tooling for enterprise-grade CI/CD pipelines.

---

## 🚀 Quick Start

```bash
npm install @oddessentials/repo-standards
```
````

```typescript
import {
  getStandards,
  getSchema,
  STANDARDS_VERSION,
} from "@oddessentials/repo-standards";

const standards = getStandards();
console.log(`Schema version: ${STANDARDS_VERSION}`);
```

---

## 📋 Human Developer Prerequisites

Before contributing to this repository or any downstream consumer, ensure:

### Required Tools

| Tool                      | Purpose                                       | Installation                                                     |
| ------------------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| **NVM** or **VersionFox** | Node.js version management                    | [nvm](https://github.com/nvm-sh/nvm) or [vfox](https://vfox.dev) |
| **Python**                | Required for some tooling (yamllint, semgrep) | [python.org](https://python.org) - **Must be in PATH**           |
| **Git**                   | Version control                               | [git-scm.com](https://git-scm.com)                               |

### Initial Setup

```bash
# 1. Install correct Node.js version
nvm install
nvm use

# 2. Install dependencies
npm ci

# 3. Verify setup (runs all quality checks)
npm run verify
```

### Cross-Platform Line Endings

This repository enforces **LF** line endings on all platforms.

**Windows users**: Git will auto-convert on checkout if configured correctly:

```bash
git config --global core.autocrlf true
```

Alternatively, use the provided `.gitattributes` which handles this automatically.

### Git Hooks (Automated)

The following happens automatically when you commit/push:

| Hook           | Trigger      | Actions                                               |
| -------------- | ------------ | ----------------------------------------------------- |
| **pre-commit** | `git commit` | Format, Lint, Commit message validation               |
| **pre-push**   | `git push`   | Typecheck, Lint, Tests, Security audit, Circular deps |

**No manual commands needed** - quality gates run automatically.

---

## 🛠️ Available Scripts

| Script                   | Description                                   |
| ------------------------ | --------------------------------------------- |
| `npm run build`          | Build the package                             |
| `npm run test`           | Run tests                                     |
| `npm run test:coverage`  | Run tests with coverage                       |
| `npm run format`         | Format all files                              |
| `npm run format:check`   | Check formatting                              |
| `npm run lint`           | Run ESLint                                    |
| `npm run lint:yaml`      | Lint YAML files                               |
| `npm run typecheck`      | TypeScript type checking                      |
| `npm run check`          | All static checks (format, lint, types, yaml) |
| `npm run verify`         | Full verification (check + test + security)   |
| `npm run check:circular` | Check for circular dependencies               |
| `npm run check:security` | npm audit                                     |

---

## 🤖 AI Agent Guidelines

AI agents operating in this repository **MUST** follow the invariants in [AGENT-SAFETY.md](./AGENT-SAFETY.md):

1. **NEVER** touch `.env` files
2. **NEVER** commit/push to `main` branch directly
3. **NEVER** skip tests without explicit human approval
4. **ALWAYS** fix root causes, not symptoms
5. **ALWAYS** treat work as enterprise-grade

See [AGENT-SAFETY.md](./AGENT-SAFETY.md) for complete guidelines.

---

## 📖 Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [AGENT-SAFETY.md](./AGENT-SAFETY.md) - AI agent safety invariants
- [SECURITY.md](./SECURITY.md) - Security policy

---

## 📄 License

MIT © [Odd Essentials](https://github.com/oddessentials)

````

### Deliverables
- [ ] README with all required badges (shields.io, auto-maintained)
- [ ] Human developer prerequisites documented
- [ ] Quick start guide
- [ ] Script reference table
- [ ] AI agent guidelines summary

---

## Phase 11: Test Coverage & Quality

### Objectives
- Enforce minimum 80% coverage
- Identify and fill coverage gaps
- Prevent test skipping without approval

### Tasks

#### 11.1 Vitest Configuration
Update `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts', 'test/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        'test/**',
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
    reporters: ['verbose'],
    testTimeout: 30000,
  },
});
````

#### 11.2 Coverage Gates in CI

Already included in CI workflow - Codecov integration with fail_ci_if_error.

### Deliverables

- [ ] Vitest configured with coverage thresholds
- [ ] Coverage reporting to Codecov
- [ ] 80% minimum coverage enforced
- [ ] Coverage gaps documented for future work

---

## Agent Instructions

> **Include this prompt when tasking AI agents with implementation work**

```
This must be done professionally with enterprise-grade best practices at the forefront.
Take your time and do the work correctly. Plan as needed so that we are efficient.

Carefully review the /docs, tests, and code to gain a full understanding of this
code repository. Then thoroughly verify the code to create an implementation plan
for the following items.

Commit each phase to the current branch after ensuring that all CI and quality
checks pass. If you encounter failures, they must be fixed in a professional,
enterprise-grade fashion whether or not they were pre-existing.

INVARIANTS (non-negotiable):
1. NEVER touch .env files
2. NEVER commit or push to main branch
3. NEVER skip tests without stopping and asking
4. ALWAYS fix root causes, not symptoms
5. ALWAYS treat this as production-grade work
```

---

## Human Developer Requirements

### Summary Checklist

When onboarding to this repository or any downstream consumer:

- [ ] **NVM or VersionFox** installed for Node.js version management
- [ ] **Python** installed and available in PATH
- [ ] **Git** configured with proper line ending handling
- [ ] Run `nvm use` (or equivalent) to use correct Node version
- [ ] Run `npm ci` to install dependencies
- [ ] Run `npm run verify` to confirm setup is correct

### What Happens Automatically

| Event             | Automated Actions                                                                |
| ----------------- | -------------------------------------------------------------------------------- |
| **Commit**        | Format code, lint, validate commit message                                       |
| **Push**          | Typecheck, lint, YAML lint, run tests, security audit, circular dependency check |
| **PR to main**    | Full CI pipeline with coverage gates                                             |
| **Merge to main** | Semantic release, changelog update, npm publish                                  |

### What You Should Never Do Manually

1. Push directly to `main` branch
2. Skip or delete failing tests
3. Commit without running pre-commit hooks
4. Publish npm packages manually (semantic-release handles this)
5. Modify `.env` files in commits

---

## Implementation Order

Execute phases in order. Each phase should be committed separately with appropriate conventional commit messages:

1. **Phase 1**: `chore(deps): update all dependencies to latest`
2. **Phase 2**: `feat(config): enforce strict TypeScript and linting`
3. **Phase 3**: `feat(release): configure semantic-release with changelog`
4. **Phase 4**: `feat(hooks): add pre-commit and pre-push automation`
5. **Phase 5**: `ci: harden CI pipeline with all quality gates`
6. **Phase 6**: `feat(security): add semgrep and npm audit integration`
7. **Phase 7**: `feat(arch): add dependency-cruiser for architecture checks`
8. **Phase 8**: `docs(safety): add AI agent safety invariants`
9. **Phase 9**: `fix: enforce LF line endings cross-platform`
10. **Phase 10**: `docs: overhaul README with enterprise-grade documentation`
11. **Phase 11**: `test: enforce 80% coverage threshold`

Final commit to trigger major version bump:

```
feat!: v7.0.0 enterprise-grade quality standards

BREAKING CHANGE: This release introduces strict typing enforcement,
AI agent safety invariants, and comprehensive quality gates.
All downstream consumers must update their configurations.
```

---

## TODO Items (If Incomplete)

If any phase cannot be completed during initial implementation, document here:

- [ ] **TODO**: Semgrep token configuration (requires account setup)
- [ ] **TODO**: Codecov token configuration (requires account linking)
- [ ] **TODO**: Full test coverage audit (identify specific gaps)
- [ ] **TODO**: Legacy warning audit (document pre-existing issues)

---
