import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import security from "eslint-plugin-security";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  // Global ignores - must be first and standalone
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "test/fixtures/**"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      security: security,
    },
    rules: {
      // TypeScript strict rules - zero tolerance for any
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",

      // Unused variables - error with escape hatches
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],

      // Code quality
      complexity: ["error", 15],
      "max-depth": ["error", 4],

      // Security plugin rules - relaxed for legitimate build/test scripts
      // These are warnings because build scripts legitimately use dynamic paths
      "security/detect-object-injection": "off", // Too many false positives in type-safe code
      "security/detect-non-literal-fs-filename": "off", // Build scripts legitimately use dynamic paths
      "security/detect-non-literal-regexp": "off", // Test files legitimately use dynamic regexps
      "security/detect-unsafe-regex": "error",
      "security/detect-buffer-noassert": "error",
      "security/detect-child-process": "warn",
      "security/detect-disable-mustache-escape": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-possible-timing-attacks": "off", // False positives
      "security/detect-pseudoRandomBytes": "error",
    },
  },
  {
    // JavaScript/CommonJS files (config files, scripts)
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      security: security,
    },
    rules: {
      // Security for JS files
      "security/detect-object-injection": "off",
      "security/detect-eval-with-expression": "error",
    },
  },
];
