/**
 * Pre-test schema version sync.
 * Ensures config/standards.json version matches package.json major version
 * before tests run. This prevents CI failures when semantic-release has
 * bumped package.json but tests run before build.
 *
 * Usage: node scripts/sync-schema-version-pretest.cjs
 */
const fs = require("fs");
const path = require("path");

const rootDir = process.cwd();
const pkgPath = path.join(rootDir, "package.json");
const standardsPath = path.join(rootDir, "config", "standards.json");

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const standards = JSON.parse(fs.readFileSync(standardsPath, "utf8"));

const pkgMajor = parseInt(pkg.version.split(".")[0], 10);

if (Number.isNaN(pkgMajor)) {
  console.error(
    `[sync-schema-version] Unable to parse major version from ${pkg.version}`,
  );
  process.exit(1);
}

if (pkgMajor > standards.version) {
  console.log(
    `[sync-schema-version] Upgrading schema version: ${standards.version} -> ${pkgMajor}`,
  );
  standards.version = pkgMajor;
  fs.writeFileSync(standardsPath, JSON.stringify(standards, null, 2) + "\n");
} else if (standards.version > pkgMajor) {
  console.error(
    `[sync-schema-version] ERROR: Schema version ${standards.version} is ahead of package.json major ${pkgMajor}`,
  );
  process.exit(1);
} else {
  console.log(
    `[sync-schema-version] Schema version ${standards.version} already matches package.json major`,
  );
}
