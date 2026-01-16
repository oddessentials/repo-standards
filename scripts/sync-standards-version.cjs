/**
 * Syncs standards.json schema version (and README references) to the provided
 * semantic-release version. Intended for the release prepare step.
 */
const fs = require("fs");
const path = require("path");

function syncStandardsVersion({
  version,
  rootDir = process.cwd(),
  logger = console,
} = {}) {
  const pkgPath = path.join(rootDir, "package.json");
  const standardsPath = path.join(rootDir, "config", "standards.json");
  const readmePath = path.join(rootDir, "README.md");

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const standards = JSON.parse(fs.readFileSync(standardsPath, "utf8"));

  const versionSource = version ?? pkg.version;
  const nextMajor = parseInt(versionSource.split(".")[0], 10);

  if (Number.isNaN(nextMajor)) {
    throw new Error(
      `[sync-standards] Unable to parse major version from ${versionSource}`,
    );
  }

  if (nextMajor <= standards.version) {
    logger.log(
      `[sync-standards] standards.json version ${standards.version} already >= ${nextMajor}; no update needed.`,
    );
    return;
  }

  standards.version = nextMajor;
  fs.writeFileSync(standardsPath, JSON.stringify(standards, null, 2) + "\n");
  logger.log(
    `[sync-standards] Updated standards.json schema version to ${nextMajor}`,
  );

  if (!fs.existsSync(readmePath)) {
    logger.warn("[sync-standards] README.md not found; skipping README update");
    return;
  }

  let readme = fs.readFileSync(readmePath, "utf8");
  const currentLineRegex = /version\s+—\s+schema version \(currently `\d+`\)/;
  if (currentLineRegex.test(readme)) {
    readme = readme.replace(
      currentLineRegex,
      `version — schema version (currently \`${nextMajor}\`)`,
    );
  } else {
    logger.warn(
      "[sync-standards] README current schema version line not found; skipping update",
    );
  }

  const versionEntry = `- \`${nextMajor}\` — Schema version aligned to package major version ${nextMajor}.`;
  if (!readme.includes(`- \`${nextMajor}\` —`)) {
    const anchor =
      "Consumers should ignore unknown fields for forward compatibility.";
    if (readme.includes(anchor)) {
      readme = readme.replace(anchor, `${versionEntry}\n\n${anchor}`);
    } else {
      logger.warn(
        "[sync-standards] README schema version list anchor not found; skipping list update",
      );
    }
  }

  fs.writeFileSync(readmePath, readme);
  logger.log("[sync-standards] Updated README schema version references");
}

if (require.main === module) {
  const providedVersion = process.argv[2];
  try {
    syncStandardsVersion({ version: providedVersion });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

module.exports = {
  syncStandardsVersion,
};
