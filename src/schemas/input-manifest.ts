// src/schemas/input-manifest.ts
// Input manifest schemas for deterministic verification

/**
 * Metadata about a file in the repository.
 */
export interface FileEntry {
  /** Relative path from repository root */
  path: string;

  /** SHA-256 hash of file contents */
  hash: string;

  /** File size in bytes */
  size: number;

  /** Last modification time (ISO 8601 UTC) */
  mtime: string;
}

/**
 * Complete manifest of inputs for verification.
 * Used to compute input_hash for determinism verification.
 */
export interface InputManifest {
  /** Manifest schema version */
  manifest_version: "1.0.0";

  /** When the manifest was created (ISO 8601 UTC) */
  created_at: string;

  // Repository state

  /** Absolute path to the repository */
  repository_path: string;

  /** Current HEAD commit SHA (if git repo) */
  git_commit?: string;

  /** Current branch name (if git repo) */
  git_branch?: string;

  /** Whether there are uncommitted changes */
  git_dirty: boolean;

  // Standards config

  /** Version of standards being used */
  standards_version: string;

  /** SHA-256 hash of .odd/standards.toml contents */
  standards_config_hash: string;

  // Scanned files

  /** List of files included in verification (sorted by path) */
  files: FileEntry[];

  // Computed hash

  /** SHA-256 hash of normalized manifest for determinism verification */
  input_hash: string;
}
