import { defineConfig } from "tsup";

export default defineConfig({
  // TODO: clean only on release build
  // clean: true,
  entry: ["src/index.ts", "src/runtime.ts"],
  format: ["esm", "cjs"],
  dts: true,
  external: ["virtual:@hiogawa/vite-import-index-html/internal"],
});
