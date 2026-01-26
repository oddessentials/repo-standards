# Dogfooding Compliance

> This repository follows its own standards.

## Core Requirements (29 items)

| Status | ID                           | Standard                              |
| ------ | ---------------------------- | ------------------------------------- |
| ✅     | `gitattributes-eol`          | Line Endings                          |
| ✅     | `crlf-detection`             | CRLF Detection in CI                  |
| ✅     | `gitignore-and-dockerignore` | Ignore Files                          |
| ✅     | `linting`                    | Linting                               |
| ✅     | `unit-test-runner`           | Unit Test Runner                      |
| ✅     | `containerization`           | Docker                                |
| ✅     | `semantic-versioning`        | Semantic Versioning                   |
| ✅     | `version-guard`              | Version Guard                         |
| ✅     | `release-artifact-exclusion` | Formatter Exclusion                   |
| ✅     | `unified-release-workflow`   | Release Workflow                      |
| ✅     | `release-hook-bypass`        | Hook Bypass                           |
| ✅     | `commit-linting`             | Commit Linting                        |
| ⚠️     | `unit-test-reporter`         | Coverage (low thresholds - CLI-heavy) |
| ✅     | `ci-quality-gates`           | CI Gates                              |
| ✅     | `code-formatter`             | Formatter                             |
| ✅     | `pre-commit-hooks`           | Hooks                                 |
| ✅     | `hook-ci-parity`             | Hook/CI Parity                        |
| ⬜     | `secret-scanning-precommit`  | N/A - public standards repo           |
| ✅     | `type-checking`              | Type Checking                         |
| ✅     | `dependency-security`        | Dep Security                          |
| ✅     | `deterministic-builds`       | Deterministic                         |
| ✅     | `provenance-security`        | Provenance                            |
| ✅     | `ci-templates-automation`    | Templates                             |
| ✅     | `runtime-version`            | Runtime Version                       |
| ✅     | `documentation`              | Docs                                  |
| ✅     | `repository-governance`      | Governance                            |
| ✅     | `canonical-verify`           | Verify Entrypoint                     |
| ✅     | `config-authority`           | Config Authority                      |
| ✅     | `explicit-skip-paths`        | Skip Paths                            |

## Recommended (12 items)

| Status | ID                              | Standard            |
| ------ | ------------------------------- | ------------------- |
| ✅     | `dependency-update-automation`  | Renovate            |
| ✅     | `dependency-architecture-rules` | Architecture Rules  |
| ✅     | `complexity-analysis`           | Complexity Analysis |
| ⬜     | `integration-testing`           | N/A - library       |
| ⬜     | `performance-baselining`        | N/A - library       |
| ⬜     | `accessibility-auditing`        | N/A - library       |
| ⬜     | `ai-drift-detection`            | N/A - not AI repo   |
| ⬜     | `ai-schema-enforcement`         | N/A - not AI repo   |
| ⬜     | `ai-golden-tests`               | N/A - not AI repo   |
| ⬜     | `ai-safety-checks`              | N/A - not AI repo   |
| ⬜     | `ai-provenance-tracking`        | N/A - not AI repo   |
| ✅     | `agent-invariants`              | Agent Invariants    |

---

**Legend**: ✅ Compliant | ⚠️ Intentional exception | ⬜ Not applicable
