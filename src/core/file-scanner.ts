// src/core/file-scanner.ts
// Repository file scanning for input manifest generation

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import type { FileEntry, InputManifest } from "../schemas/index.js";
import type { StandardsConfig } from "./config-loader.js";

/**
 * Compute SHA-256 hash of a file's contents.
 */
export function computeFileHash(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Check if a path should be excluded based on common ignore patterns.
 */
function shouldExclude(
  relativePath: string,
  excludePatterns: string[],
): boolean {
  // Security: Prevent directory traversal
  // Reject paths containing '..' or starting with '/'
  if (relativePath.includes("..") || relativePath.startsWith("/")) {
    return true;
  }

  // Common exclude patterns
  const defaultExcludes = [
    "node_modules/",
    ".git/",
    "dist/",
    "build/",
    "coverage/",
    ".next/",
    ".nuxt/",
    "out/",
    "target/",
  ];

  for (const pattern of defaultExcludes) {
    if (relativePath.startsWith(pattern)) {
      return true;
    }
  }

  // Check custom exclude patterns
  for (const pattern of excludePatterns) {
    if (relativePath.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Recursively scan a directory and collect file entries.
 */
function scanDirectory(
  dirPath: string,
  repoRoot: string,
  excludePatterns: string[],
  files: FileEntry[],
): void {
  const entries = readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    const relativePath = relative(repoRoot, fullPath);

    if (shouldExclude(relativePath, excludePatterns)) {
      continue;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath, repoRoot, excludePatterns, files);
    } else if (entry.isFile()) {
      try {
        const stats = statSync(fullPath);
        const hash = computeFileHash(fullPath);

        files.push({
          path: relativePath.replace(/\\/g, "/"), // Normalize to forward slashes
          hash,
          size: stats.size,
          mtime: stats.mtime.toISOString(),
        });
      } catch {
        // Skip files we can't read
      }
    }
  }
}

/**
 * Get git repository information.
 */
function getGitInfo(repoPath: string): {
  git_commit?: string;
  git_branch?: string;
  git_dirty: boolean;
} {
  const gitDir = join(repoPath, ".git");
  if (!existsSync(gitDir)) {
    return { git_dirty: false };
  }

  try {
    const git_commit = execSync("git rev-parse HEAD", {
      cwd: repoPath,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    const git_branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: repoPath,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    const statusOutput = execSync("git status --porcelain", {
      cwd: repoPath,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const git_dirty = statusOutput.trim().length > 0;

    return { git_commit, git_branch, git_dirty };
  } catch {
    return { git_dirty: false };
  }
}

/**
 * Scan a repository and build an InputManifest.
 *
 * @param repoPath - Absolute path to the repository root
 * @param config - Standards configuration
 * @returns InputManifest with all file entries (sorted by path)
 */
export function scanRepository(
  repoPath: string,
  config: StandardsConfig,
): Omit<InputManifest, "input_hash"> {
  const files: FileEntry[] = [];
  const excludePatterns = config.exclude || [];

  scanDirectory(repoPath, repoPath, excludePatterns, files);

  // Sort files by path for determinism
  files.sort((a, b) => a.path.localeCompare(b.path));

  const gitInfo = getGitInfo(repoPath);

  return {
    manifest_version: "1.0.0",
    created_at: new Date().toISOString(),
    repository_path: repoPath,
    ...gitInfo,
    standards_version: config.version,
    standards_config_hash: config.config_hash,
    files,
  };
}
