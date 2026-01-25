/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment:
        "Circular dependencies are forbidden - they cause issues with tree-shaking and can lead to runtime errors",
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: "no-orphans",
      severity: "warn",
      comment:
        "Orphan modules (not reachable from entry points) should be reviewed for removal",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$", // dotfiles
          "\\.d\\.ts$", // type definitions
          "\\.test\\.ts$", // test files
          "(^|/)test/", // test directory
          "(^|/)scripts/", // scripts are entry points
        ],
      },
      to: {},
    },
    {
      name: "not-to-dev-dep",
      severity: "error",
      comment:
        "Production code should not import dev dependencies - this would fail at runtime",
      from: {
        path: "^src",
        pathNot: "\\.test\\.ts$",
      },
      to: {
        dependencyTypes: ["npm-dev"],
      },
    },
    {
      name: "no-deprecated-core",
      severity: "warn",
      comment: "Avoid using deprecated Node.js core modules",
      from: {},
      to: {
        dependencyTypes: ["core"],
        path: "^(punycode|domain|constants|sys|_linklist|_stream_wrap)$",
      },
    },
    {
      name: "not-to-unresolvable",
      severity: "error",
      comment: "Don't depend on modules that cannot be resolved",
      from: {},
      to: {
        couldNotResolve: true,
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/[^/]+",
      },
      text: {
        highlightFocused: true,
      },
    },
  },
};
