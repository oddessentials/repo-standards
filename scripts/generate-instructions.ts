// scripts/generate-instructions.ts
//
// Generates instructions.md from a stack+CI specific JSON file.
// Usage: npx ts-node-esm scripts/generate-instructions.ts [config-file]
// Example: npm run generate:instructions standards.python.github-actions.json
// Default: config/standards.typescript-js.github-actions.json

import fs from "node:fs";
import path from "node:path";

interface StackHints {
  exampleTools?: string[];
  exampleConfigFiles?: string[];
  notes?: string;
  verification?: string;
  requiredFiles?: string[];
  optionalFiles?: string[];
  requiredScripts?: string[];
  anyOfFiles?: string[];
  pinningNotes?: string;
  machineCheck?: {
    command: string;
    expectExitCode?: number;
    description?: string;
  };
  bazelHints?: {
    commands?: string[];
    recommendedTargets?: string[];
    notes?: string;
  };
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  ciHints?: Record<string, { job?: string; stage?: string }>;
  stack?: StackHints;
}

interface StackChecklistJson {
  version: number;
  stack: string;
  stackLabel: string;
  ciSystems: string[];
  checklist: {
    core: ChecklistItem[];
    recommended: ChecklistItem[];
    optionalEnhancements: ChecklistItem[];
  };
}

/**
 * Generate 2-5 high-level bullets from a checklist item.
 */
function generateBullets(item: ChecklistItem): string[] {
  const bullets: string[] = [];
  const stack = item.stack;

  // Bullet 1: Core purpose from description
  bullets.push(item.description);

  // Bullet 2: Verification guidance
  if (stack?.verification) {
    bullets.push(`Verify with: ${stack.verification}`);
  }

  // Bullet 3: Required files / any-of files
  if (stack?.requiredFiles?.length || stack?.anyOfFiles?.length) {
    const requiredFiles = stack?.requiredFiles?.join(", ");
    const anyOfFiles = stack?.anyOfFiles?.join(", ");
    if (requiredFiles && anyOfFiles) {
      bullets.push(
        `Ensure ${requiredFiles} exists, and at least one of ${anyOfFiles} is present.`,
      );
    } else if (requiredFiles) {
      bullets.push(`Ensure ${requiredFiles} exists in the repository.`);
    } else if (anyOfFiles) {
      bullets.push(`Ensure at least one of ${anyOfFiles} is present.`);
    }
  }

  // Bullet 4: Required scripts
  if (stack?.requiredScripts?.length) {
    const scripts = stack.requiredScripts.map((s) => `\`${s}\``).join(", ");
    bullets.push(`Define a ${scripts} script or equivalent command.`);
  }

  // Bullet 5: Machine check hint
  if (stack?.machineCheck) {
    const description = stack.machineCheck.description
      ? `${stack.machineCheck.description} `
      : "";
    const expectCode = stack.machineCheck.expectExitCode ?? 0;
    bullets.push(
      `${description}Run \`${stack.machineCheck.command}\` (expect exit code ${expectCode}).`,
    );
  }

  if (stack?.exampleTools?.length || stack?.exampleConfigFiles?.length) {
    const tools = stack.exampleTools?.join(", ");
    const configs = stack.exampleConfigFiles?.join(", ");
    if (tools && configs) {
      bullets.push(`Common tools: ${tools}. Example config files: ${configs}.`);
    } else if (tools) {
      bullets.push(`Common tools: ${tools}.`);
    } else if (configs) {
      bullets.push(`Example config files: ${configs}.`);
    }
  }

  if (stack?.pinningNotes) {
    bullets.push(stack.pinningNotes);
  }

  if (stack?.optionalFiles?.length) {
    const files = stack.optionalFiles.slice(0, 3).join(", ");
    const more = stack.optionalFiles.length > 3 ? " and others" : "";
    bullets.push(`Consider adding ${files}${more} if applicable.`);
  }

  if (stack?.bazelHints?.commands?.length) {
    const commands = stack.bazelHints.commands.map((cmd) => `\`${cmd}\``);
    bullets.push(`Bazel commands: ${commands.join(", ")}.`);
  }

  if (stack?.bazelHints?.recommendedTargets?.length) {
    const targets = stack.bazelHints.recommendedTargets.join(", ");
    bullets.push(`Recommended Bazel targets: ${targets}.`);
  }

  if (stack?.bazelHints?.notes) {
    bullets.push(stack.bazelHints.notes);
  }

  // Notes-based guidance (if short enough)
  if (stack?.notes && stack.notes.length < 150) {
    bullets.push(stack.notes);
  }

  // Limit to 5 bullets
  return bullets.slice(0, 5);
}

function generateSection(title: string, items: ChecklistItem[]): string {
  if (items.length === 0) return "";

  const lines: string[] = [];
  lines.push(`## ${title}`);
  lines.push("");

  for (const item of items) {
    lines.push(`### ${item.label}`);
    lines.push("");

    const bullets = generateBullets(item);
    for (const bullet of bullets) {
      lines.push(`- ${bullet}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function main() {
  const rootDir = process.cwd();

  // Accept config file as CLI argument, default to TypeScript+GitHub Actions
  const configArg = process.argv[2];
  let inputPath: string;

  if (configArg) {
    // If argument provided, resolve relative to config/ or as absolute
    if (path.isAbsolute(configArg)) {
      inputPath = configArg;
    } else if (
      configArg.startsWith("config/") ||
      configArg.startsWith("config\\")
    ) {
      inputPath = path.join(rootDir, configArg);
    } else {
      inputPath = path.join(rootDir, "config", configArg);
    }
  } else {
    inputPath = path.join(
      rootDir,
      "config",
      "standards.typescript-js.github-actions.json",
    );
  }

  // Derive output filename from input (e.g., standards.python.json -> instructions.python.md)
  const inputBasename = path.basename(inputPath, ".json");
  const outputBasename = inputBasename.replace(/^standards\./, "instructions.");
  const outputPath = path.join(rootDir, `${outputBasename}.md`);

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    console.error("Usage: npm run generate:instructions [config-file]");
    console.error(
      "Example: npm run generate:instructions standards.python.github-actions.json",
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(inputPath, "utf8");
  const data: StackChecklistJson = JSON.parse(raw);

  const lines: string[] = [];

  // Header
  lines.push("# Repository Standards Instructions");
  lines.push("");
  lines.push(`> Auto-generated from \`${path.relative(rootDir, inputPath)}\``);
  lines.push(`> Stack: ${data.stackLabel} | CI: ${data.ciSystems.join(", ")}`);
  lines.push("");
  lines.push(
    "This document provides high-level guidance for an autonomous coding agent to bring a repository into compliance with the defined standards.",
  );
  lines.push("");

  // Generate sections
  lines.push(generateSection("Core Requirements", data.checklist.core));
  lines.push(
    generateSection("Recommended Practices", data.checklist.recommended),
  );
  lines.push(
    generateSection(
      "Optional Enhancements",
      data.checklist.optionalEnhancements,
    ),
  );

  // Write output
  fs.writeFileSync(outputPath, lines.join("\n"));
  console.log(`Wrote ${outputPath}`);
}

main();
