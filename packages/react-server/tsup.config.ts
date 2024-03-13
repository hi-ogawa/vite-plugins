import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts", "src/plugin/index.ts"],
    format: ["esm"],
    dts: true,
  },
]);
