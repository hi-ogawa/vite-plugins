import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/hooks/data.ts",
    "src/hooks/register-data.ts",
    "src/hooks/wasm.ts",
    "src/hooks/register-wasm.ts",
  ],
  format: ["esm"],
  dts: true,
});
