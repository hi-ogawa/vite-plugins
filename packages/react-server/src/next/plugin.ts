import path from "node:path";
// @ts-ignore type error on initial build as it depends on itself
import { vitePluginReactServer } from "@hiogawa/react-server/plugin";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import type { PluginOption } from "vite";

export function vitePluginReactServerNext(options?: {
  plugins?: PluginOption[];
}): PluginOption {
  return [
    vitePluginReactServer({
      routeDir: "app",
      plugins: options?.plugins,
    }),
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: "@hiogawa/react-server/next/entry-ssr",
      preview: path.resolve("./dist/server/index.js"),
    }),
  ];
}
