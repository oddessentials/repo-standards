// src/types.ts

/**
 * Bazel execution hints for individual checklist items.
 * Commands are actual Bazel invocations (e.g., "bazel test //..."),
 * NOT assumed pattern labels.
 */
export interface BazelHints {
  /** Bazel commands to run (e.g., "bazel test //...", "bazel run //tools/lint") */
  commands?: string[];
  /** Recommended target conventions (documentation only, not assumed to exist) */
  recommendedTargets?: string[];
  /** Usage notes for this check in Bazel context */
  notes?: string;
}

export type StackId =
  | "typescript-js"
  | "csharp-dotnet"
  | "python"
  | "rust"
  | "go";
export type CiSystem = "azure-devops" | "github-actions";

export interface MasterJson {
  version: number;
  meta?: any;
  ciSystems: CiSystem[];
  stacks: Record<StackId, { label: string; languageFamily: string }>;
  checklist: any;
}

export interface StackChecklistJson {
  version: number;
  stack: StackId;
  stackLabel: string;
  ciSystems: CiSystem[];
  meta?: any;
  checklist: any;
}
