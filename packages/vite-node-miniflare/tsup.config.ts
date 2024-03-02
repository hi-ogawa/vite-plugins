import { defineConfig } from "tsup";

export default [
  defineConfig({
    entry: ["src/client/worker-entry.ts"],
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
