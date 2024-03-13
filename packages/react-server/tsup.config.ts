import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts", "src/plugin.ts"],
    format: ["esm"],
    dts: true,
  },
]);
