import fs from "node:fs";
import { defineConfig } from "tsup";

// build in two steps to export worker entry script as string

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
