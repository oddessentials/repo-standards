// scripts/generate-readme-counts.ts
// Generates checklist item counts dynamically from standards.json
// Prevents count rot by computing at build time

import fs from "node:fs";
import path from "node:path";

interface MasterJson {
  version: number;
  checklist: {
    core: unknown[];
    recommended: unknown[];
    optionalEnhancements: unknown[];
  };
}

function main() {
  const rootDir = process.cwd();
  const masterPath = path.join(rootDir, "config", "standards.json");

  if (!fs.existsSync(masterPath)) {
    console.error(`standards.json not found at ${masterPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(masterPath, "utf8");
  const master: MasterJson = JSON.parse(raw);

  const coreCount = master.checklist.core.length;
  const recommendedCount = master.checklist.recommended.length;
  const optionalCount = master.checklist.optionalEnhancements.length;

  // Output markdown snippet for README
  console.log(
    `**${coreCount} core** (required), **${recommendedCount} recommended**, **${optionalCount} optional enhancements**`,
  );
}

main();
