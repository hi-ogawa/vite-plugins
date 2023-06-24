import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/runtime.ts", "src/runtime-internal.ts"],
  format: ["esm", "cjs"],
  dts: true,
});
