import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.d.ts",
        "src/types.ts", // Type definitions only, no runtime code
      ],
      // v7 Coverage Thresholds
      // Target: 80% for new code. Current baseline set to prevent regression.
      // CLI is excluded from strict thresholds as it's argument parsing with process.exit
      thresholds: {
        lines: 25,
        functions: 35,
        branches: 0,
        statements: 25,
      },
    },
  },
});
