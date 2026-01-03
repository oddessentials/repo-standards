/**
 * Syncs manifest.json version with package.json
 * Called by semantic-release exec plugin during release
 *
 * @see https://github.com/semantic-release/exec
 */
const fs = require("fs");
const path = require("path");

const pkgPath = path.join(process.cwd(), "package.json");
const manifestPath = path.join(process.cwd(), "manifest.json");

if (!fs.existsSync(manifestPath)) {
  console.log("[sync-manifest] No manifest.json found, skipping");
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

manifest.version = pkg.version;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log(`[sync-manifest] Updated manifest.json to ${pkg.version}`);
