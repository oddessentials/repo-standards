#!/usr/bin/env tsx
// scripts/build.ts

/**
 * Build script for @oddessentials/repo-standards
 * - Copies master config/standards.json to dist/config/
 * - Generates stack-specific JSON artifacts into dist/config/
 * - Ensures deterministic output (sorted keys, no timestamps)
 */

import { execSync } from "node:child_process";
import {
  writeFileSync,
  readFileSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);

// Helper to sort object keys recursively for deterministic output
function sortObject(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortObject);
  if (obj && typeof obj === "object") {
    const sorted: Record<string, unknown> = {};
    Object.keys(obj as Record<string, unknown>)
      .sort()
      .forEach((key) => {
        sorted[key] = sortObject((obj as Record<string, unknown>)[key]);
      });
    return sorted;
  }
  return obj;
}
/**
 * Ensure schema version matches package.json major version.
 * - Auto-upgrades schema when package.json major is higher (for semantic-release)
 * - Fails if schema is ahead of package (prevents manual drift)
 */
function syncSchemaVersion(rootDir: string): void {
  const pkgPath = join(rootDir, "package.json");
  const standardsPath = join(rootDir, "config", "standards.json");

  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const standards = JSON.parse(readFileSync(standardsPath, "utf8"));

  // Extract major version from package.json (e.g., "2.1.0" -> 2)
  const pkgMajor = parseInt(pkg.version.split(".")[0], 10);

  if (pkgMajor > standards.version) {
    // Auto-upgrade schema version when semantic-release bumps package.json
    console.log(
      `Upgrading schema version: ${standards.version} -> ${pkgMajor} (from package.json)`,
    );
    standards.version = pkgMajor;
    writeFileSync(standardsPath, JSON.stringify(standards, null, 2) + "\n");
  } else if (standards.version > pkgMajor) {
    // Schema ahead of package = manual drift, fail build
    throw new Error(
      `Schema version drift: standards.json version=${standards.version} ` +
        `is ahead of package.json major=${pkgMajor}. ` +
        `This should not happen - schema version is set by CI.`,
    );
  } else {
    console.log(
      `Schema version ${standards.version} matches package.json major`,
    );
  }
}

// Run the existing generator for each stack (and optional CI system)
function generateStack(stack: string, ci?: string) {
  const args = ["scripts/generate-standards.ts", stack];
  if (ci) args.push(ci);
  const cmd = `npx tsx ${args.join(" ")}`;
  console.log(`Generating ${stack}${ci ? " for " + ci : ""}`);
  execSync(cmd, { stdio: "inherit" });
}

/**
 * Generate src/version.ts with current package version
 * This runs before TypeScript compilation so the values are baked in
 */
function generateVersionFile(rootDir: string): void {
  const pkgPath = join(rootDir, "package.json");
  const versionPath = join(rootDir, "src", "version.ts");

  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const standards = JSON.parse(
    readFileSync(join(rootDir, "config", "standards.json"), "utf8"),
  );

  const content = `/**
 * AUTO-GENERATED at build time by scripts/build.ts
 * DO NOT EDIT MANUALLY
 *
 * This module provides version information for the repo-standards package.
 * Consumers should import from here instead of package.json to avoid
 * ESM/CJS interop issues.
 */

export const STANDARDS_VERSION = '${pkg.version}';
export const STANDARDS_SCHEMA_VERSION = ${standards.version};
`;

  writeFileSync(versionPath, content);
  console.log(`Generated src/version.ts with version ${pkg.version}`);
}

function main() {
  const rootDir = process.cwd();
  const configSrc = resolve(rootDir, "config");
  const configDest = resolve(rootDir, "dist", "config");

  // Generate version.ts before TypeScript compilation
  generateVersionFile(rootDir);

  // Sync schema version with package.json major version (before generation)
  syncSchemaVersion(rootDir);

  // Ensure dist/config exists
  mkdirSync(configDest, { recursive: true });

  // Copy master standards.json first
  copyFileSync(
    join(configSrc, "standards.json"),
    join(configDest, "standards.json"),
  );
  console.log("Copied master standards.json to dist/config/");

  const stacks = ["typescript-js", "csharp-dotnet", "python", "rust", "go"];
  const ciSystems = ["azure-devops", "github-actions"];

  // Generate each stack without CI suffix
  for (const stack of stacks) {
    generateStack(stack);
  }

  // Generate CI-specific views
  for (const stack of stacks) {
    for (const ci of ciSystems) {
      generateStack(stack, ci);
    }
  }

  // Copy all generated files from config/ to dist/config/
  const generatedFiles = readdirSync(configSrc).filter(
    (f) => f.startsWith("standards.") && f.endsWith(".json"),
  );

  for (const file of generatedFiles) {
    const srcPath = join(configSrc, file);
    const destPath = join(configDest, file);

    // Read, sort for determinism, and write
    const data = JSON.parse(readFileSync(srcPath, "utf8"));
    const sorted = sortObject(data);
    writeFileSync(destPath, JSON.stringify(sorted, null, 2) + "\n");
  }

  console.log(
    `Build complete – ${generatedFiles.length} artifacts written to dist/config/`,
  );
}

// ESM entrypoint check
if (process.argv[1] === __filename) {
  main();
}
