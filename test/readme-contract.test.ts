// test/readme-contract.test.ts
// Validates that README references match actual package structure
// Prevents documentation drift

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(process.cwd());
const readmePath = path.join(rootDir, "README.md");
const pkgPath = path.join(rootDir, "package.json");

describe("README contract (prevents drift)", () => {
  it("README exists", () => {
    expect(fs.existsSync(readmePath)).toBe(true);
  });

  const readme = fs.readFileSync(readmePath, "utf8");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  it("documented npm scripts exist in package.json", () => {
    // Extract script references from README (excluding code blocks)
    // Match `npm run <script>` but not inside code fences or template examples
    const lines = readme.split("\n");
    const documentedScripts = new Set<string>();

    let inBazelSection = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Track if we're in the Bazel integration table (examples only)
      if (
        line.includes("| Task ") &&
        line.includes("| npm ") &&
        line.includes("| Bazel ")
      ) {
        inBazelSection = true;
        continue;
      }
      // Exit Bazel section after empty line
      if (inBazelSection && line.trim() === "") {
        inBazelSection = false;
      }

      // Skip code fences, templates, and Bazel alternatives table
      if (
        line.trim().startsWith("```") ||
        line.includes("templates/") ||
        inBazelSection
      ) {
        continue;
      }

      const matches = line.matchAll(/`npm run ([a-z:]+)`/g);
      for (const match of matches) {
        documentedScripts.add(match[1]);
      }
    }

    // Skip scripts that are documented as examples or Bazel alternatives
    const exampleScripts = new Set(["coverage"]); // Documented in Bazel integration table

    for (const scriptName of documentedScripts) {
      if (exampleScripts.has(scriptName)) {
        continue; // Skip example scripts
      }

      expect(
        pkg.scripts,
        `README references 'npm run ${scriptName}' but script not found in package.json`,
      ).toHaveProperty(scriptName);
    }
  });

  it("documented CLI binary matches package.json bin", () => {
    if (readme.includes("repo-standards")) {
      expect(pkg.bin).toHaveProperty("repo-standards");
      expect(pkg.bin["repo-standards"]).toBe("./dist/cli.js");
    }
  });

  it("documented exports match actual exports from index.ts", async () => {
    // Check for documented function references
    const exportedFunctions = [
      "getStandards",
      "getSchema",
      "loadBaseline",
      "loadMasterSpec",
      "listSupportedStacks",
      "listSupportedCiSystems",
    ];

    const indexPath = path.join(rootDir, "src", "index.ts");
    const indexContent = fs.readFileSync(indexPath, "utf8");

    for (const fn of exportedFunctions) {
      if (readme.includes(fn)) {
        expect(
          indexContent,
          `README documents ${fn}() but not found in src/index.ts`,
        ).toMatch(new RegExp(`export function ${fn}`));
      }
    }
  });

  it("documented version exports match src/version.ts", () => {
    if (readme.includes("STANDARDS_VERSION")) {
      const versionPath = path.join(rootDir, "src", "version.ts");
      const versionContent = fs.readFileSync(versionPath, "utf8");
      expect(versionContent).toMatch(/export.*STANDARDS_VERSION/);
    }

    if (readme.includes("STANDARDS_SCHEMA_VERSION")) {
      const versionPath = path.join(rootDir, "src", "version.ts");
      const versionContent = fs.readFileSync(versionPath, "utf8");
      expect(versionContent).toMatch(/export.*STANDARDS_SCHEMA_VERSION/);
    }
  });

  it("referenced config files exist", () => {
    const configReferences = [
      "config/standards.json",
      "config/standards.schema.json",
    ];

    for (const configPath of configReferences) {
      if (readme.includes(configPath)) {
        expect(
          fs.existsSync(path.join(rootDir, configPath)),
          `README references ${configPath} but file not found`,
        ).toBe(true);
      }
    }
  });
});
