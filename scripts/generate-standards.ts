// scripts/generate-standards.ts

import fs from "node:fs";
import path from "node:path";

type StackId = "typescript-js" | "csharp-dotnet" | "python";
type CiSystem = "azure-devops" | "github-actions";

interface StackMeta {
  label: string;
  languageFamily: string;
}

interface CiHintsForSystem {
  stage?: string;
  job?: string;
}

type CiHints = Partial<Record<CiSystem, CiHintsForSystem>>;

interface StackHints {
  exampleTools?: string[];
  exampleConfigFiles?: string[];
  notes?: string;
  // NEW: per-stack human instructions for how to verify the item
  verification?: string;
}

interface ChecklistItemMaster {
  id: string;
  label: string;
  description: string;
  appliesTo: {
    stacks: StackId[];
    ciSystems?: CiSystem[];
  };
  ciHints?: CiHints;
  stackHints?: Partial<Record<StackId, StackHints>>;
}

interface ChecklistSection {
  core: ChecklistItemMaster[];
  recommended: ChecklistItemMaster[];
  optionalEnhancements: ChecklistItemMaster[];
}

interface MigrationStep {
  step: number;
  title: string;
  description: string;
  focusIds?: string[];
  notes?: string;
}

interface Meta {
  defaultCoverageThreshold?: number;
  complexityChecks?: {
    enabledByDefault?: boolean;
    description?: string;
  };
  qualityGatePolicy?: {
    preferSoftFailOnLegacy?: boolean;
    description?: string;
  };
  migrationGuide?: MigrationStep[];
}

interface MasterJson {
  version: number;
  meta?: Meta;
  ciSystems: CiSystem[];
  stacks: Record<StackId, StackMeta>;
  checklist: ChecklistSection;
}

interface StackItem {
  id: string;
  label: string;
  description: string;
  ciHints?: CiHints;
  // For the filtered file, this is the single stack’s hints including verification
  stack?: StackHints;
}

interface StackChecklistJson {
  version: number;
  stack: StackId;
  stackLabel: string;
  ciSystems: CiSystem[];
  meta?: Meta;
  checklist: {
    core: StackItem[];
    recommended: StackItem[];
    optionalEnhancements: StackItem[];
  };
}

function filterSectionForStackAndCi(
  items: ChecklistItemMaster[],
  stack: StackId,
  ciSystem?: CiSystem
): StackItem[] {
  return items
    .filter((item) => {
      if (!item.appliesTo.stacks.includes(stack)) return false;

      if (ciSystem && item.appliesTo.ciSystems) {
        return item.appliesTo.ciSystems.includes(ciSystem);
      }
      return true;
    })
    .map((item) => {
      const stackHint = item.stackHints?.[stack];

      const result: StackItem = {
        id: item.id,
        label: item.label,
        description: item.description
      };

      if (item.ciHints) {
        if (ciSystem) {
          const perSystem = item.ciHints[ciSystem];
          if (perSystem) {
            result.ciHints = { [ciSystem]: perSystem };
          }
        } else {
          result.ciHints = item.ciHints;
        }
      }

      if (stackHint) {
        // Includes exampleTools, exampleConfigFiles, notes, verification
        result.stack = stackHint;
      }

      return result;
    });
}

function generateStackJson(
  master: MasterJson,
  stack: StackId,
  ciSystem?: CiSystem
): StackChecklistJson {
  const stackMeta = master.stacks[stack];
  const ciSystems = ciSystem ? [ciSystem] : master.ciSystems;

  return {
    version: master.version,
    stack,
    stackLabel: stackMeta?.label ?? stack,
    ciSystems,
    meta: master.meta,
    checklist: {
      core: filterSectionForStackAndCi(master.checklist.core, stack, ciSystem),
      recommended: filterSectionForStackAndCi(
        master.checklist.recommended,
        stack,
        ciSystem
      ),
      optionalEnhancements: filterSectionForStackAndCi(
        master.checklist.optionalEnhancements,
        stack,
        ciSystem
      )
    }
  };
}

// --- entrypoint ---
const rootDir = path.join(process.cwd());
const masterPath = path.join(rootDir, "config", "standards.json");

const raw = fs.readFileSync(masterPath, "utf8");
const master: MasterJson = JSON.parse(raw);

// args: stack [ciSystem]
const targetStack = (process.argv[2] as StackId) || "typescript-js";
const targetCiSystem = process.argv[3] as CiSystem | undefined;

const stackJson = generateStackJson(master, targetStack, targetCiSystem);

const outDir = path.join(rootDir, "config");
fs.mkdirSync(outDir, { recursive: true });

const ciSuffix = targetCiSystem ? `.${targetCiSystem}` : "";
const outPath = path.join(outDir, `standards.${targetStack}${ciSuffix}.json`);

fs.writeFileSync(outPath, JSON.stringify(stackJson, null, 2) + "\n");

console.log(`Wrote ${outPath}`);
