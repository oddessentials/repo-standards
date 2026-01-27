#!/usr/bin/env node
/**
 * repo-standards CLI
 *
 * Usage:
 *   repo-standards --version
 *   repo-standards --help
 *   repo-standards <stack> [ci-system]
 *   repo-standards verify <path> [options]
 *   repo-standards apply <path> [options]
 *   repo-standards doctor <verify-result.json>
 *   repo-standards migrate --from <v1> --to <v2>
 */

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  loadBaseline,
  listSupportedStacks,
  listSupportedCiSystems,
} from "./index.js";
import type { StackId, CiSystem } from "./types.js";
import { verify } from "./commands/verify.js";
import { apply } from "./commands/apply.js";
import { doctor } from "./commands/doctor.js";
import { migrate, listVersions } from "./commands/migrate.js";
import type { VerifyResult } from "./schemas/index.js";

// Dynamic version reading from package.json for determinism invariant compliance
const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };

/** Package version - dynamically read from package.json for determinism */
export const VERSION: string = pkg.version;

function printHelp(): void {
  console.log(`repo-standards v${VERSION}

Usage:
  repo-standards --version                Print version and exit
  repo-standards --help                   Print this help message
  repo-standards <stack> [ci]             Get standards for a stack (legacy)

Commands:
  repo-standards verify <path>            Verify repository compliance
    Options:
      --json                              Output as JSON (default)
      --summary                           Output summary only

  repo-standards apply <path>             Apply standards artifacts
    Options:
      --dry-run                           Show what would change
      --force                             Overwrite existing files

  repo-standards doctor <result.json>     Analyze findings and propose fixes
    Options:
      --stdin                             Read from stdin

  repo-standards migrate                  Generate migration plan
    Options:
      --from <version>                    Source version
      --to <version>                      Target version
      --list-versions                     List available versions

Supported stacks: ${listSupportedStacks().join(", ")}
Supported CI systems: ${listSupportedCiSystems().join(", ")}

Examples:
  repo-standards verify .
  repo-standards apply . --dry-run
  repo-standards doctor result.json
  repo-standards migrate --from 6.0.0 --to 7.0.0
  repo-standards typescript-js github-actions
`);
}

async function runVerify(args: string[]): Promise<void> {
  const pathArg = args.find((a) => !a.startsWith("--")) || ".";
  const summaryOnly = args.includes("--summary");

  try {
    const result = await verify(pathArg);

    if (summaryOnly) {
      console.log(`Compliance: ${result.is_compliant ? "PASS" : "FAIL"}`);
      console.log(`Findings: ${result.summary.total}`);
      console.log(`  Errors: ${result.summary.by_severity.error}`);
      console.log(`  Warnings: ${result.summary.by_severity.warn}`);
      console.log(`  Info: ${result.summary.by_severity.info}`);
      console.log(`Input Hash: ${result.input_hash.substring(0, 16)}...`);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }

    process.exit(result.is_compliant ? 0 : 1);
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(2);
  }
}

async function runApply(args: string[]): Promise<void> {
  const pathArg = args.find((a) => !a.startsWith("--")) || ".";
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");

  try {
    const result = await apply(pathArg, { dry_run: dryRun, force });

    console.log(JSON.stringify(result, null, 2));

    process.exit(0);
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(2);
  }
}

async function runDoctor(args: string[]): Promise<void> {
  const fromStdin = args.includes("--stdin");
  let verifyResultJson: string;

  if (fromStdin) {
    // Read from stdin
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    verifyResultJson = Buffer.concat(chunks).toString("utf8");
  } else {
    const filePath = args.find((a) => !a.startsWith("--"));
    if (!filePath) {
      console.error(
        "Error: Please provide a verify result file or use --stdin",
      );
      process.exit(2);
    }
    try {
      verifyResultJson = readFileSync(resolve(filePath), "utf8");
    } catch {
      console.error(`Error: Cannot read file ${filePath}`);
      process.exit(2);
    }
  }

  try {
    const verifyResult = JSON.parse(verifyResultJson) as VerifyResult;
    const result = await doctor(verifyResult);

    console.log(JSON.stringify(result, null, 2));

    process.exit(0);
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(2);
  }
}

async function runMigrate(args: string[]): Promise<void> {
  if (args.includes("--list-versions")) {
    console.log("Available versions:");
    for (const version of listVersions()) {
      console.log(`  ${version}`);
    }
    process.exit(0);
  }

  const fromIndex = args.indexOf("--from");
  const toIndex = args.indexOf("--to");

  if (fromIndex === -1 || toIndex === -1) {
    console.error("Error: Both --from and --to are required");
    console.error(
      "Usage: repo-standards migrate --from <version> --to <version>",
    );
    process.exit(2);
  }

  const fromVersion = args[fromIndex + 1];
  const toVersion = args[toIndex + 1];

  if (!fromVersion || !toVersion) {
    console.error("Error: Version values required after --from and --to");
    process.exit(2);
  }

  try {
    const result = await migrate(fromVersion, toVersion);

    console.log(JSON.stringify(result, null, 2));

    process.exit(result.can_migrate ? 0 : 1);
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(2);
  }
}

function runLegacy(stackArg: string, ciArg?: string): void {
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

async function main(): Promise<void> {
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

  const [command, ...restArgs] = args;

  // Route to appropriate command handler
  switch (command) {
    case "verify":
      await runVerify(restArgs);
      break;

    case "apply":
      await runApply(restArgs);
      break;

    case "doctor":
      await runDoctor(restArgs);
      break;

    case "migrate":
      await runMigrate(restArgs);
      break;

    default:
      // Legacy: treat as stack name
      if (command) {
        runLegacy(command, restArgs[0]);
      } else {
        printHelp();
        process.exit(1);
      }
      break;
  }
}

main().catch((error) => {
  console.error(
    `Fatal error: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(2);
});
