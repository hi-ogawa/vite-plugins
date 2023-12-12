import fs from "node:fs";
import { defineConfig } from "tsup";

// build in two steps to export worker entry script as string

export default [
  defineConfig(() => ({
    entry: ["src/worker.ts"],
    format: ["esm"],
    platform: "browser",
    dts: true,
    esbuildOptions: (options) => {
      // patch to run "vite-node/client" on workerd
      options.define = {
        "process.platform": '"linux"',
        "process.env": "{}",
      };
      options.alias = {
        "node:fs": "./src/polyfills/node-fs.ts",
        "node:module": "./src/polyfills/node-module.ts",
        "node:path": "./src/polyfills/node-path.ts",
        "node:url": "./src/polyfills/node-url.ts",
        "node:vm": "./src/polyfills/node-vm.ts",
      };
    },
  })),
  defineConfig(() => ({
    entry: ["src/index.ts"],
    format: ["esm"],
    platform: "node",
    dts: true,
    esbuildOptions: (options) => {
      options.define = {
        __DEFINE_WORKER_SCRIPT: JSON.stringify(
          fs.readFileSync("./dist/worker.js", "utf-8")
        ),
      };
    },
  })),
][process.env["BUILD_STEP"]!];
