// src/types.ts

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
