import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/cli.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: false, // We handle dist/config separately in build.ts
  outDir: "dist",
  splitting: false,
  sourcemap: true,
  // Shim import.meta.url for CJS output
  shims: true,
  // Don't bundle dependencies
  external: [],
  // Ensure we emit both .js (ESM) and .cjs (CJS)
  outExtension({ format }) {
    return {
      js: format === "cjs" ? ".cjs" : ".js",
    };
  },
});
