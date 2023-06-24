import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/hattip.ts"],
  format: ["esm", "cjs"],
  dts: true,
  external: ["/virtual:@hiogawa/vite-index-html-middleware/internal"],
});
