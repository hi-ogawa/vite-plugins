import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts", "src/plugin.ts", "src/entry-ssr.ts"],
    format: ["esm"],
    dts: !process.env["NO_DTS"],
  },
]);
