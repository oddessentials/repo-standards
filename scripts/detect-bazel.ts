// scripts/detect-bazel.ts

/**
 * Standalone Bazel detection utility.
 * Does NOT require Bazel to be installed.
 * Only checks repo-root markers to avoid false positives from vendored deps.
 */

import fs from "node:fs";
import path from "node:path";

export interface BazelDetectionResult {
  /** Whether Bazel markers were detected at repo root */
  detected: boolean;
  /** Bazel mode: bzlmod (MODULE.bazel) or workspace (WORKSPACE*) */
  mode?: "bzlmod" | "workspace";
  /** List of detected marker files */
  markers: string[];
}

/** Root-level markers that indicate a Bazel repo */
const ROOT_MARKERS = {
  bzlmod: ["MODULE.bazel"],
  workspace: ["WORKSPACE.bazel", "WORKSPACE"],
};

/** Optional markers that support Bazel but don't trigger detection alone */
const OPTIONAL_MARKERS = [".bazelrc", ".bazelversion"];

/**
 * Detect Bazel at repo root only.
 * Does NOT scan subdirectories for BUILD files (avoids vendored deps false positives).
 *
 * @param repoRoot - Absolute path to repository root
 * @returns Detection result with mode and found markers
 */
export function detectBazel(repoRoot: string): BazelDetectionResult {
  const foundMarkers: string[] = [];
  let mode: "bzlmod" | "workspace" | undefined;

  // Check bzlmod first (preferred)
  for (const marker of ROOT_MARKERS.bzlmod) {
    if (fs.existsSync(path.join(repoRoot, marker))) {
      foundMarkers.push(marker);
      mode = "bzlmod";
    }
  }

  // Check workspace if no bzlmod
  if (!mode) {
    for (const marker of ROOT_MARKERS.workspace) {
      if (fs.existsSync(path.join(repoRoot, marker))) {
        foundMarkers.push(marker);
        mode = "workspace";
        break; // Only need one workspace marker
      }
    }
  }

  // Check optional markers (don't affect detection, just informational)
  for (const marker of OPTIONAL_MARKERS) {
    if (fs.existsSync(path.join(repoRoot, marker))) {
      foundMarkers.push(marker);
    }
  }

  return {
    detected: mode !== undefined,
    mode,
    markers: foundMarkers,
  };
}

// CLI entrypoint for manual testing
if (
  import.meta.url.startsWith("file:") &&
  process.argv[1]?.includes("detect-bazel")
) {
  const targetDir = process.argv[2] || process.cwd();
  const result = detectBazel(path.resolve(targetDir));
  console.log(JSON.stringify(result, null, 2));
}
