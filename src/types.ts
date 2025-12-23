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

/**
 * Enforcement level for checklist items.
 * - required: Must be implemented (core items)
 * - recommended: Should be implemented (recommended items)
 * - optional: Nice to have (optional enhancements)
 */
export type Enforcement = "required" | "recommended" | "optional";

/**
 * Severity level for violations.
 * - error: Fails CI (core items)
 * - warn: Warning only (recommended items)
 * - info: Informational (optional enhancements)
 */
export type Severity = "error" | "warn" | "info";

/** Migration guide step for onboarding repositories */
export interface MigrationStep {
  step: number;
  title: string;
  description: string;
  focusIds?: string[];
  notes?: string;
}

/** Bazel integration configuration */
export interface BazelIntegration {
  description?: string;
  detectionRules?: {
    rootMarkers?: string[];
    optionalMarkers?: string[];
    notes?: string;
  };
  optOut?: {
    description?: string;
    configPath?: string;
  };
  targetConventions?: Record<string, string>;
  ciContract?: {
    versionPinning?: string;
    configFlag?: string;
    deterministicFlags?: string[];
    remoteCache?: string;
  };
  advisoryNotice?: string;
}

/**
 * Meta configuration for the standards.
 * Includes coverage thresholds, quality gate policies, and migration guidance.
 */
export interface Meta {
  /**
   * Default code coverage threshold as a ratio (0-1).
   * E.g., 0.8 = 80% coverage.
   */
  defaultCoverageThreshold?: number;
  /**
   * Documents that coverage threshold is a ratio (0-1), not a percentage (0-100).
   */
  coverageThresholdUnit?: "ratio";
  coverageThresholdDescription?: string;
  complexityChecks?: {
    enabledByDefault?: boolean;
    description?: string;
  };
  qualityGatePolicy?: {
    preferSoftFailOnLegacy?: boolean;
    description?: string;
  };
  migrationGuide?: MigrationStep[];
  bazelIntegration?: BazelIntegration;
}

export interface MasterJson {
  version: number;
  meta?: Meta;
  ciSystems: CiSystem[];
  stacks: Record<StackId, { label: string; languageFamily: string }>;
  checklist: {
    core: ChecklistItem[];
    recommended: ChecklistItem[];
    optionalEnhancements: ChecklistItem[];
  };
}

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  enforcement?: Enforcement;
  severity?: Severity;
  appliesTo: {
    stacks: StackId[];
    ciSystems?: CiSystem[];
  };
  ciHints?: Record<CiSystem, { stage?: string; job?: string; notes?: string }>;
  stackHints?: Record<StackId, StackHints>;
}

export interface StackHints {
  exampleTools?: string[];
  exampleConfigFiles?: string[];
  notes?: string;
  verification?: string;
  requiredFiles?: string[];
  anyOfFiles?: string[];
  optionalFiles?: string[];
  requiredScripts?: string[];
  pinningNotes?: string;
  bazelHints?: BazelHints;
}

export interface StackChecklistJson {
  version: number;
  stack: StackId;
  stackLabel: string;
  ciSystems: CiSystem[];
  meta?: Meta;
  checklist: {
    core: ChecklistItem[];
    recommended: ChecklistItem[];
    optionalEnhancements: ChecklistItem[];
  };
}
