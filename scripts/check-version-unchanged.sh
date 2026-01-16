#!/usr/bin/env bash
set -euo pipefail

if [[ "${VERSION_GUARD_ALLOW:-}" == "1" ]]; then
  echo "Version guard: bypass enabled (VERSION_GUARD_ALLOW=1)."
  exit 0
fi

base_ref="${1:-}"
if [[ -z "$base_ref" ]]; then
  echo "Usage: $0 <base-ref>"
  echo "Example: $0 origin/main"
  exit 2
fi

version_pattern='("version"\s*:|\bversion\s*=|<Version>|<VersionPrefix>|<VersionSuffix>|<PackageVersion>|<AssemblyVersion>|<FileVersion>)'

changed_files=$(git diff --name-only "${base_ref}...HEAD")
if [[ -z "$changed_files" ]]; then
  echo "Version guard: no changes detected."
  exit 0
fi

has_violation=0

while IFS= read -r file; do
  case "$file" in
    package.json|pyproject.toml|setup.cfg|setup.py|Cargo.toml|VERSION|Directory.Build.props|*.csproj)
      diff_output=$(git diff -U0 "${base_ref}...HEAD" -- "$file" || true)
      if echo "$diff_output" | rg -n --pcre2 "^[+-](?![+-]).*${version_pattern}" > /dev/null; then
        echo "Version guard: manual version change detected in $file"
        has_violation=1
      fi
      ;;
    *)
      ;;
  esac
done <<< "$changed_files"

if [[ "$has_violation" -eq 1 ]]; then
  cat <<'MESSAGE'

Manual version edits detected. If semantic-release or automated versioning owns
version bumps, remove manual edits and let the release pipeline update versions.
If this change is intentional (e.g., release automation), set VERSION_GUARD_ALLOW=1.
MESSAGE
  exit 1
fi

echo "Version guard: no manual version changes detected."
