// src/core/input-hash.ts
// Deterministic input hashing for reproducibility verification

import { createHash } from "node:crypto";
import stableStringify from "fast-json-stable-stringify";
import type { InputManifest } from "../schemas/index.js";

/**
 * Compute a deterministic SHA-256 hash of all verification inputs.
 *
 * The hash is computed from:
 * 1. Standards version
 * 2. Standards config hash
 * 3. All file paths and their content hashes (sorted)
 *
 * This ensures that:
 * - Same inputs always produce the same hash
 * - No external state affects the hash
 * - No network access is required
 *
 * @param manifest - Input manifest (without input_hash field)
 * @returns SHA-256 hash as hex string
 */
export function computeInputHash(
  manifest: Omit<InputManifest, "input_hash">,
): string {
  // Create a normalized representation for hashing
  const normalized = {
    standards_version: manifest.standards_version,
    standards_config_hash: manifest.standards_config_hash,
    // Only include path and hash for each file (ignore mtime, size for determinism)
    // Sort by path to ensure file order doesn't affect hash
    files: manifest.files
      .map((f) => ({
        path: f.path,
        hash: f.hash,
      }))
      .sort((a, b) => a.path.localeCompare(b.path)),
  };

  // Use stable stringify to ensure consistent key ordering
  const serialized = stableStringify(normalized);

  // Compute SHA-256 hash
  return createHash("sha256").update(serialized).digest("hex");
}
