import { defineConfig } from "tsup";

export default [
  defineConfig({
    entry: ["src/worker.ts"],
    format: ["esm"],
    platform: "browser",
    noExternal: [/.*/],
  }),
  defineConfig({
    entry: ["src/index.ts"],
    format: ["esm"],
    platform: "node",
    dts: true,
  }),
];
