import path from "node:path";
import { vitePluginReactServer } from "@hiogawa/react-server/plugin";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import type { PluginOption } from "vite";

export function vitePluginReactServerNext({
  plugins,
}: {
  plugins?: PluginOption[];
}): PluginOption {
  return [
    react(),
    vitePluginReactServer({
      plugins,
      routeDir: "app",
    }),
    // for now, ssr entry setup is not done by vitePluginReactServer
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: "virtual:entry-ssr",
      preview: path.resolve("./dist/server/index.js"),
    }),
    {
      name: "virtual-entry-ssr",
      resolveId(source, _importer, _options) {
        if (source === "virtual:entry-ssr") {
          return "\0" + source;
        }
        return;
      },
      load(id, _options) {
        if (id === "\0virtual:entry-ssr") {
          return `
            import { handler } from "@hiogawa/react-server/entry-server";
            import { webToNodeHandler } from "@hiogawa/utils-node";
            export default webToNodeHandler(handler);
          `;
        }
        return;
      },
    },
  ];
}
