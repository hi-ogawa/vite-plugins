import { defineConfig } from "tsup";

export default [
  defineConfig({
    // entry: ["src/client/worker-entry.ts"],
    entry: ["src/v6/worker.ts"],
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
