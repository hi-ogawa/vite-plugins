import { defineConfig } from "tsup";

// separate tsup config from the main one
// since this one is trivial setup

export default defineConfig(() => ({
  entry: {
    "server/pre-bundle/plugin": "src/server/pre-bundle/plugin.ts",
    "server/pre-bundle/cli": "src/server/pre-bundle/cli.ts",
  },
  format: ["esm"],
  platform: "node",
  dts: true,
}));
