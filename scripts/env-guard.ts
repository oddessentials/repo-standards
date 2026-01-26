/**
 * env-guard.ts
 *
 * Policy script to prevent .env* files from being committed.
 * This script is part of the v7 security policy enforcement.
 *
 * AI agents MUST NEVER read, write, or modify .env* files.
 * This guard ensures compliance with the AI Agent Safety Invariant.
 */

import { execSync } from "node:child_process";

function checkStagedEnvFiles(): void {
  try {
    // Get list of staged files
    const staged = execSync("git diff --cached --name-only", {
      encoding: "utf8",
    }).trim();

    if (!staged) {
      console.log("✓ No staged files to check");
      return;
    }

    const stagedFiles = staged.split("\n");
    const envFiles = stagedFiles.filter((file) => {
      const basename = file.split("/").pop() ?? "";
      return basename.startsWith(".env");
    });

    if (envFiles.length > 0) {
      console.error("\n❌ ERROR: .env* files are staged for commit!\n");
      console.error("The following .env files must NOT be committed:");
      envFiles.forEach((file) => console.error(`  - ${file}`));
      console.error("\nThis violates the AI Agent Safety Invariant.");
      console.error(
        "Remove these files from staging with: git reset HEAD <file>",
      );
      console.error("");
      process.exit(1);
    }

    console.log("✓ No .env* files staged for commit");
  } catch (error) {
    // If git command fails (e.g., not in a git repo), skip the check
    if (
      error instanceof Error &&
      error.message.includes("not a git repository")
    ) {
      console.log("⚠ Not in a git repository, skipping env-guard check");
      return;
    }
    throw error;
  }
}

function checkEnvFilesInWorkingTree(): void {
  try {
    // Check if any .env files exist in the working tree (that are tracked or untracked)
    const result = execSync(
      "git ls-files --others --cached -- '.env*' '*/.env*'",
      {
        encoding: "utf8",
      },
    ).trim();

    if (result) {
      const envFiles = result.split("\n").filter(Boolean);
      if (envFiles.length > 0) {
        console.warn("\n⚠ WARNING: .env* files detected in repository:");
        envFiles.forEach((file) => console.warn(`  - ${file}`));
        console.warn("\nEnsure these are in .gitignore and not committed.\n");
      }
    }
  } catch {
    // Silently ignore errors for this check
  }
}

// Main execution
console.log("Running env-guard policy check...");
checkStagedEnvFiles();
checkEnvFilesInWorkingTree();
console.log("✓ env-guard policy check passed\n");
