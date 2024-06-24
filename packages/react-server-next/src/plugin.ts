import path from "node:path";
import { vitePluginReactServer } from "@hiogawa/react-server/plugin";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import type { PluginOption } from "vite";

export function vitePluginReactServerNext(options?: {
  plugins?: PluginOption[];
}): PluginOption {
  return [
    react(),
    vitePluginReactServer({
      plugins: options?.plugins,
      routeDir: "app",
    }),
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: "@hiogawa/react-server-next/entry-ssr",
      preview: path.resolve("./dist/server/index.js"),
    }),
  ];
}
