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
 * Sync schema version with package.json major version.
 * This ensures the schema version always matches the package major version.
 */
function syncSchemaVersion(rootDir: string): void {
  const pkgPath = join(rootDir, "package.json");
  const standardsPath = join(rootDir, "config", "standards.json");

  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const standards = JSON.parse(readFileSync(standardsPath, "utf8"));

  // Extract major version from package.json (e.g., "2.0.0" -> 2)
  const pkgMajor = parseInt(pkg.version.split(".")[0], 10);

  if (standards.version !== pkgMajor) {
    console.log(
      `Syncing schema version: ${standards.version} -> ${pkgMajor} (from package.json)`,
    );
    standards.version = pkgMajor;
    writeFileSync(standardsPath, JSON.stringify(standards, null, 2) + "\n");
  } else {
    console.log(`Schema version ${standards.version} matches package.json`);
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

function main() {
  const rootDir = process.cwd();
  const configSrc = resolve(rootDir, "config");
  const configDest = resolve(rootDir, "dist", "config");

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
