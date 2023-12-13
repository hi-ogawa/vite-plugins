import fs from "node:fs";
import { defineConfig } from "tsup";

// build in two steps to export worker entry script as string

export default [
  defineConfig(() => ({
    entry: {
      "client/worker-entry": "src/client/worker-entry.ts",
      "client/vite-node": "src/client/vite-node.ts",
    },
    format: ["esm"],
    platform: "browser",
    dts: true,
    splitting: false,
    noExternal: [/.*/],
    esbuildOptions: (options) => {
      // patch to run "vite-node/client" on workerd
      options.define = {
        "process.platform": '"linux"',
        "process.env": "{}",
      };
      options.alias = {};
      for (const mod of ["fs", "module", "path", "url", "vm"]) {
        options.alias[`node:${mod}`] = `./src/client/polyfills/node-${mod}.ts`;
      }
    },
  })),
  defineConfig(() => ({
    entry: ["src/index.ts"],
    format: ["esm"],
    platform: "node",
    dts: true,
    esbuildOptions: (options) => {
      options.define = {
        __DEFINE_WORKER_ENTRY_SCRIPT: JSON.stringify(
          fs.readFileSync("./dist/client/worker-entry.js", "utf-8")
        ),
      };
    },
  })),
][process.env["BUILD_STEP"]!];
