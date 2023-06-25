import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/index-html.ts"],
  format: ["esm", "cjs"],
  dts: true,
  external: ["virtual:@hiogawa/vite-expose-index-html/internal"],
});
