// @ts-nocheck
// type error on initial build as it depends on itself

import path from "node:path";
import { vitePluginReactServer } from "@hiogawa/react-server/plugin";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import type { AliasOptions, Plugin, PluginOption } from "vite";

const nextAlias: AliasOptions = [
  {
    find: /^next(\/.*)?/,
    replacement: "@hiogawa/react-server/next/compat$1",
  },
];

const nextAliasPlugin: Plugin = {
  name: "next-compat-alias",
  config: () => ({
    resolve: {
      alias: nextAlias,
    },
  }),
};

export function vitePluginReactServerNext(options?: {
  plugins?: PluginOption[];
}): PluginOption {
  return [
    nextAliasPlugin,
    vitePluginReactServer({
      routeDir: "app",
      plugins: [nextAliasPlugin, ...(options?.plugins ?? [])],
    }),
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: "@hiogawa/react-server/next/entry-ssr",
      preview: path.resolve("./dist/server/index.js"),
    }),
  ];
}
