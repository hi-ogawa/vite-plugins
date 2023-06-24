import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/hattip.ts", "src/internal.ts"],
  format: ["esm", "cjs"],
  dts: true,
});
