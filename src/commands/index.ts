// src/commands/index.ts
// Barrel export for all commands

export { verify, type VerifyOptions } from "./verify.js";
export { apply, type ApplyOptions, type ApplyReport } from "./apply.js";
export { doctor, type DoctorOptions, type DoctorReport } from "./doctor.js";
export { migrate, type MigrateOptions, type MigrationPlan } from "./migrate.js";
