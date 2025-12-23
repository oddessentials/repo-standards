# [3.0.0](https://github.com/oddessentials/repo-standards/compare/v2.1.0...v3.0.0) (2025-12-23)

- fix!: align schema version with package.json major version ([aa703dd](https://github.com/oddessentials/repo-standards/commit/aa703dd8eece0288539fd78c30931adbac30f2c4))

### BREAKING CHANGES

- Schema version corrected from 3 to 2 to match package.json major.

* standards.json version: 3 -> 2

* standards.schema.json: , minimum, description updated to v2

* build.ts: syncSchemaVersion() auto-upgrades on major bump, fails if schema ahead

* index.test.ts: expects version 2, added version sync invariant test

* README.md: updated version references

# [2.1.0](https://github.com/oddessentials/repo-standards/compare/v2.0.1...v2.1.0) (2025-12-23)

### Features

- schema validation added ([9907d51](https://github.com/oddessentials/repo-standards/commit/9907d5143d0d07e62127bf314a82494cbb5c246c))
- standarize for monorepos ([ba14141](https://github.com/oddessentials/repo-standards/commit/ba14141afd80f725896af774f85f5c1e51b37b75))

## [2.0.1](https://github.com/oddessentials/repo-standards/compare/v2.0.0...v2.0.1) (2025-12-23)

### Bug Fixes

- **schema:** loosen requiredFiles/Scripts for cross-stack compatibility ([5d3b022](https://github.com/oddessentials/repo-standards/commit/5d3b0226106309674336304d1ff548d6d952af75))

# [2.0.0](https://github.com/oddessentials/repo-standards/compare/v1.2.1...v2.0.0) (2025-12-23)

### Features

- add bazel ([7a34875](https://github.com/oddessentials/repo-standards/commit/7a34875b79adac0a3868c6fb2cd42a92942ac62b))
- **bazel:** add Bazel as optional build executor substrate ([4cbfa75](https://github.com/oddessentials/repo-standards/commit/4cbfa754069678016397d35d230f3acb6e8a6341))

### BREAKING CHANGES

- **bazel:** Added bazelHints field to StackHints and meta.bazelIntegration section.
  Schema version now syncs with package.json major version during build.

* Root-level Bazel detection via MODULE.bazel, WORKSPACE.bazel, WORKSPACE
* Per-check bazelHints with advisory commands (illustrative, repo-defined)
* CI contract recommendations (.bazelversion, --config=ci)
* Opt-out via meta.bazelIntegration.enabled = false
* Detection script: scripts/detect-bazel.ts
* Test fixtures: bzlmod-repo, workspace-repo, no-bazel-repo, hybrid-monorepo
* Build-time schema version sync with package.json major version

# [2.0.0](https://github.com/oddessentials/repo-standards/compare/v1.2.1...v2.0.0) (2025-12-23)

### ⚠ BREAKING CHANGES

- Schema version reflects package.json major version (now synchronized)
- Added `bazelHints` field to `StackHints` (consumers may encounter new field)
- Added `meta.bazelIntegration` section

### Features

- **Bazel Integration**: Support for Bazel as optional build executor substrate
- Root-level Bazel detection via `MODULE.bazel`, `WORKSPACE.bazel`, `WORKSPACE`
- Per-check `bazelHints` with advisory commands (illustrative, repo-defined)
- CI contract recommendations (`.bazelversion`, `--config=ci`)
- Opt-out mechanism via `meta.bazelIntegration.enabled = false`
- Detection script: `scripts/detect-bazel.ts`

### Testing

- Added fixtures: bzlmod-repo, workspace-repo, no-bazel-repo (regression), hybrid-monorepo
- Tests ensure non-Bazel repos are unchanged
- Tests verify bazelHints uses command format (not pattern labels)

### Documentation

- New "Bazel Integration" section in README
- Realistic CI examples for GitHub Actions and Azure DevOps (Bazelisk install)

## [1.2.1](https://github.com/oddessentials/repo-standards/compare/v1.2.0...v1.2.1) (2025-12-23)

### Bug Fixes

- semantic release ([339df72](https://github.com/oddessentials/repo-standards/commit/339df720cccc5fb1ff6e7ee18ec4c44f9b880ed0))

# [1.2.0](https://github.com/oddessentials/repo-standards/compare/v1.1.0...v1.2.0) (2025-12-23)

### Features

- add dep-management tooling ([17077b4](https://github.com/oddessentials/repo-standards/commit/17077b43ced3012d100da6bedcc8ee5957ac9550))

# [1.1.0](https://github.com/oddessentials/repo-standards/compare/v1.0.1...v1.1.0) (2025-12-23)

### Features

- add support for rust and go ([51f38f6](https://github.com/oddessentials/repo-standards/commit/51f38f6e5125e288fa3ba6cad0eb9a45168275fc))

## [1.0.1](https://github.com/oddessentials/repo-standards/compare/v1.0.0...v1.0.1) (2025-12-12)

### Bug Fixes

- bump and publish ([27f0c89](https://github.com/oddessentials/repo-standards/commit/27f0c89445fd71cdd243039d5f1bf4c2e46c4c9e))

# 1.0.0 (2025-12-12)

### Bug Fixes

- add name alias key for stacks ([627941b](https://github.com/oddessentials/repo-standards/commit/627941b0a4ecfd553069117dcc04aab4f1e7b955))
- linting config needed for ci ([e5891f6](https://github.com/oddessentials/repo-standards/commit/e5891f6c0bcfacee1aca3db8f82a89358cfb8639))

### Features

- add changelog and bump version automatically ([1dd9a44](https://github.com/oddessentials/repo-standards/commit/1dd9a441b0b1550a6a996d6a5a1d8b8aba9c67b4))
- add code formatting enforcement ([7fe0eee](https://github.com/oddessentials/repo-standards/commit/7fe0eeedc6c176beb4a4acd2be66017ac8a12538))
- add complexity measure in eslint ([6ac117d](https://github.com/oddessentials/repo-standards/commit/6ac117d432fc2b0c1f97ab898b1edd5c661dd6d1))
- add runtime version locking ([b46f461](https://github.com/oddessentials/repo-standards/commit/b46f4614f0eb1bc102dbd7af8c7d155e3464646b))
- add verificiation steps ([7c2e14e](https://github.com/oddessentials/repo-standards/commit/7c2e14e4042c64e212f36fc71fd07d8c8bbf42ee))
- eat the dog food ([63ab4a8](https://github.com/oddessentials/repo-standards/commit/63ab4a89251cdb2f048746544a7d1ade9b921ba7))
- make instruction generation dynamic ([f8cc7cd](https://github.com/oddessentials/repo-standards/commit/f8cc7cddca5c079c034af6f3f4a89764ab1bc0ef))
- staging instruction generator ([4880107](https://github.com/oddessentials/repo-standards/commit/4880107e39c75dce4433e3bff6baa76d9422885e))

### Reverts

- de-emphasize code styling. It was fine as is ([147e109](https://github.com/oddessentials/repo-standards/commit/147e109cf4a69f6a66f0449091d2c4aec081d351))
