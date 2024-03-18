import path from "node:path";
import { vitePluginReactServer } from "@hiogawa/react-server/plugin";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import { type Plugin, defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  plugins: [
    react(),
    vitePluginReactServer({
      plugins: [testVitePluginVirtual()],
    }),
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: process.env["SSR_ENTRY"] || "/src/adapters/node.ts",
      preview: path.resolve("./dist/server/index.js"),
    }),
    testVitePluginVirtual(),
  ],
  ssr: {
    // needs to inline react-wrap-balancer since its default export
    // is not recognized by NodeJS. See:
    //   node -e 'import("react-wrap-balancer").then(console.log)'
    //   https://publint.dev/react-wrap-balancer@1.1.0
    noExternal: ["react-wrap-balancer"],
  },
});

function testVitePluginVirtual(): Plugin {
  return {
    name: "test:" + testVitePluginVirtual.name,
    resolveId(source, _importer, _options) {
      if (source === "virtual:test-use-client") {
        return "\0" + source;
      }
      return;
    },
    load(id, _options) {
      if (id === "\0virtual:test-use-client") {
        return /* js */ `
          "use client";
          export function TestVirtualUseClient() {
            return "TestVirtualUseClient";
          }
        `.trimStart();
      }
      return;
    },
  };
}
