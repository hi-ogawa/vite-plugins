import path from "node:path";
import { vitePluginReactServer } from "@hiogawa/react-server/plugin";
import { vitePluginSsrMiddleware } from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import { type Plugin, defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  plugins: [
    react(),
    vitePluginReactServer({
      plugins: [testVitePluginVirtual()],
    }),
    vitePluginSsrMiddleware({
      entry: process.env["SSR_ENTRY"] || "/src/adapters/node.ts",
      preview: path.resolve("./dist/server/index.js"),
    }),
    testVitePluginVirtual(),
  ],
});

function testVitePluginVirtual(): Plugin {
  return {
    name: "test:" + testVitePluginVirtual.name,
    resolveId(source, _importer, _options) {
      if (source === "virtual:use-client") {
        return "\0" + source;
      }
      return;
    },
    load(id, _options) {
      if (id === "\0virtual:use-client") {
        return /* js */ `
          "use client";
          export function VirtualUseClient() {
            return "VirtualUseClient";
          }
        `.trimStart();
      }
      return;
    },
  };
}
