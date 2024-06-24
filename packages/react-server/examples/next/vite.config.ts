import path from "node:path";
import { vitePluginReactServer } from "@hiogawa/react-server/plugin";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  plugins: [
    react(),
    vitePluginReactServer({
      routeDir: "app",
    }),
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: "virtual:entry-ssr-node",
      preview: path.resolve("./dist/server/index.js"),
    }),
    {
      name: "virtual-entry-ssr-node",
      resolveId(source, _importer, _options) {
        if (source === "virtual:entry-ssr-node") {
          return "\0" + source;
        }
      },
      load(id, _options) {
        if (id === "\0virtual:entry-ssr-node") {
          return `
            import { handler } from "@hiogawa/react-server/entry-server";
            import { webToNodeHandler } from "@hiogawa/utils-node";
            export default webToNodeHandler(handler);
          `;
        }
      },
    },
  ],
});
