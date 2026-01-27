// src/core/config-loader.ts
// Load and parse .odd/standards.toml configuration

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import * as TOML from "@iarna/toml";
import type { StackId, CiSystem } from "../types.js";

/**
 * Configuration for a standards pack.
 */
export interface PackConfig {
  /** Pack identifier */
  id: string;

  /** Whether the pack is enabled */
  enabled: boolean;

  /** Pack-specific options */
  options?: Record<string, unknown>;
}

/**
 * Parsed .odd/standards.toml configuration.
 */
export interface StandardsConfig {
  /** Standards version (e.g., "7.0.0") */
  version: string;

  /** Stack identifier */
  stack: StackId;

  /** CI system (optional) */
  ci_system?: CiSystem;

  /** Configured packs */
  packs: PackConfig[];

  /** Custom exclusions */
  exclude?: string[];

  /** Raw TOML content hash for determinism */
  config_hash: string;
}

/**
 * Default configuration when no .odd/standards.toml exists.
 */
const DEFAULT_CONFIG: Omit<StandardsConfig, "config_hash"> = {
  version: "7.0.0",
  stack: "typescript-js",
  packs: [{ id: "core", enabled: true }],
};

/**
 * Load standards configuration from .odd/standards.toml.
 *
 * @param repoPath - Absolute path to the repository root
 * @returns Parsed configuration object
 * @throws Error if configuration is invalid
 */
export function loadStandardsConfig(repoPath: string): StandardsConfig {
  const configPath = join(repoPath, ".odd", "standards.toml");

  if (!existsSync(configPath)) {
    // Return default config with empty hash
    return {
      ...DEFAULT_CONFIG,
      config_hash: "",
    };
  }

  const content = readFileSync(configPath, "utf8");

  // Compute config hash for determinism
  const config_hash = createHash("sha256").update(content).digest("hex");

  let parsed: Record<string, unknown>;
  try {
    parsed = TOML.parse(content) as Record<string, unknown>;
  } catch (error) {
    throw new Error(
      `Invalid TOML in ${configPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Validate and extract configuration
  const version = (parsed.version as string) || DEFAULT_CONFIG.version;
  const stack = (parsed.stack as StackId) || DEFAULT_CONFIG.stack;
  const ci_system = parsed.ci_system as CiSystem | undefined;
  const exclude = parsed.exclude as string[] | undefined;

  // Parse packs configuration
  const packsRaw = parsed.packs as Record<string, unknown>[] | undefined;
  const packs: PackConfig[] = packsRaw
    ? packsRaw.map((p) => ({
        id: p.id as string,
        enabled: p.enabled !== false,
        options: p.options as Record<string, unknown> | undefined,
      }))
    : DEFAULT_CONFIG.packs;

  return {
    version,
    stack,
    ci_system,
    packs,
    exclude,
    config_hash,
  };
}
