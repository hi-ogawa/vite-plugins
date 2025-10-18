import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/vite.ts", "src/runtime.ts"],
  format: ["esm"],
  dts: true,
});
