// scripts/types.internal.ts
// Internal types for build scripts - not exported to consumers

/**
 * Minimal package.json shape for version extraction.
 * Only includes fields used by build scripts.
 */
export interface PackageJson {
  version: string;
  scripts?: Record<string, string>;
  bin?: Record<string, string>;
}

/**
 * Re-export MasterJson from src/types for use in scripts
 * without circular dependency concerns.
 */
export type { MasterJson } from "../src/types.js";
