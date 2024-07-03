import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: [
      "src/index.ts",
      "src/server.ts",
      "src/client.tsx",
      "src/runtime/server.ts",
      "src/runtime/client.ts",
      "src/runtime/browser.ts",
      "src/runtime/ssr.ts",
      "src/entry/server.tsx",
      "src/entry/ssr.tsx",
      "src/entry/browser.tsx",
      "src/plugin/index.ts",
    ],
    format: ["esm"],
    dts: !process.env["NO_DTS"],
    external: [/^virtual:/, /^@hiogawa\/react-server\//, /^\/dist\//],
  },
]);
