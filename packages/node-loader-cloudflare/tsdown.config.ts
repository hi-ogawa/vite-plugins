import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/vite.ts"],
  format: ["esm"],
  dts: true,
}) as any;
