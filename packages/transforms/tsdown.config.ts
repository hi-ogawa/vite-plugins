import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: {
    sourcemap: process.argv.slice(2).includes("--sourcemap"),
  },
}) as any;
