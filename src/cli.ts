#!/usr/bin/env node
/**
 * repo-standards CLI
 *
 * Usage:
 *   repo-standards --version
 *   repo-standards --help
 *   repo-standards <stack> [ci-system]
 */

import { createRequire } from "node:module";
import {
  loadBaseline,
  listSupportedStacks,
  listSupportedCiSystems,
} from "./index.js";
import type { StackId, CiSystem } from "./types.js";

// Dynamic version reading from package.json for determinism invariant compliance
const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };

/** Package version - dynamically read from package.json for determinism */
export const VERSION: string = pkg.version;

function printHelp(): void {
  console.log(`repo-standards v${VERSION}

Usage:
  repo-standards --version       Print version and exit
  repo-standards --help          Print this help message
  repo-standards <stack> [ci]    Get standards for a stack (optional CI system)

Supported stacks: ${listSupportedStacks().join(", ")}
Supported CI systems: ${listSupportedCiSystems().join(", ")}

Examples:
  repo-standards typescript-js
  repo-standards python github-actions
`);
}

function main(): void {
  const args = process.argv.slice(2);

  // Handle --version
  if (args.includes("--version") || args.includes("-V")) {
    console.log(VERSION);
    process.exit(0);
  }

  // Handle --help or no args
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    printHelp();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const [stackArg, ciArg] = args;
  const validStacks = listSupportedStacks();
  const validCiSystems = listSupportedCiSystems();

  // Validate stack
  if (!validStacks.includes(stackArg as StackId)) {
    console.error(`Error: Unknown stack "${stackArg}"`);
    console.error(`Valid stacks: ${validStacks.join(", ")}`);
    process.exit(1);
  }

  // Validate CI system if provided
  if (ciArg && !validCiSystems.includes(ciArg as CiSystem)) {
    console.error(`Error: Unknown CI system "${ciArg}"`);
    console.error(`Valid CI systems: ${validCiSystems.join(", ")}`);
    process.exit(1);
  }

  // Load and output standards
  const standards = loadBaseline(
    stackArg as StackId,
    ciArg as CiSystem | undefined,
  );
  console.log(JSON.stringify(standards, null, 2));
}

main();
