// @ts-nocheck
// type error on initial build since the package depends on itself

import path from "node:path";
import { vitePluginReactServer } from "@hiogawa/react-server/plugin";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import type { Plugin, PluginOption } from "vite";

export function vitePluginReactServerNext(options?: {
  plugins?: PluginOption[];
}): PluginOption {
  return [
    nextAliasPlugin,
    vitePluginReactServer({
      routeDir: "app",
      entryBrowser: "@hiogawa/react-server/next/entry-browser",
      entryServer: "@hiogawa/react-server/entry-react-server",
      plugins: [nextAliasPlugin, ...(options?.plugins ?? [])],
    }),
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: "@hiogawa/react-server/next/entry-ssr",
      preview: path.resolve("./dist/server/index.js"),
    }),
  ];
}

const nextAliasPlugin: Plugin = {
  name: "next-compat-alias",
  config: () => ({
    resolve: {
      alias: [
        {
          find: /^next(\/.*)?/,
          replacement: "@hiogawa/react-server/next/compat$1",
        },
      ],
    },
  }),
};
