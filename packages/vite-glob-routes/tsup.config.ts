import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/internal.ts",
    "src/react-router.ts",
    "src/hattip.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
});
