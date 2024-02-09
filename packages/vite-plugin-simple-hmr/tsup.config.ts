import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/runtime.ts"],
  format: ["esm"],
  dts: true,
  splitting: false,
});
