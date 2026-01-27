// src/internal/baseline-loader.ts
// Internal module for loading baseline standards without circular dependencies

import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import type { StackChecklistJson, StackId, CiSystem } from "../types.js";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to config directory:
// - When running from src/ (dev/test): use repo root config/
// - When running from dist/ (installed): use dist/config/
const isDevMode = __dirname.includes("src");
const configDir = isDevMode
  ? join(__dirname, "..", "..", "config")
  : join(__dirname, "..", "config");

/**
 * Load a stack-specific checklist (optionally filtered by CI system).
 * Internal function to avoid circular dependencies.
 */
export function loadBaseline(
  stack: StackId,
  ci?: CiSystem,
): StackChecklistJson {
  const suffix = ci ? `.${ci}` : "";
  const file = `standards.${stack}${suffix}.json`;
  const filePath = join(configDir, file);
  return JSON.parse(readFileSync(filePath, "utf8")) as StackChecklistJson;
}
