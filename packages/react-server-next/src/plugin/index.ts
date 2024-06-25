import path from "node:path";
import { vitePluginReactServer } from "@hiogawa/react-server/plugin";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import type { Plugin, PluginOption } from "vite";

export default function next(options?: {
  plugins?: PluginOption[];
}): PluginOption {
  return [
    vitePluginReactServer({
      routeDir: "app",
      entryBrowser: "@hiogawa/react-server-next/plugin/entry-browser",
      entryServer: "@hiogawa/react-server-next/plugin/entry-server",
      buildScanMode: "server",
      plugins: [nextEsbuildJsx, ...(options?.plugins ?? [])],
    }),
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: "@hiogawa/react-server-next/plugin/entry-ssr",
      preview: path.resolve("./dist/server/index.js"),
    }),
  ];
}

// overrdied next.js's default `jsx: preserve`
const nextEsbuildJsx: Plugin = {
  name: "next-esbuild-jsx",
  config: () => ({
    esbuild: {
      jsx: "automatic",
    },
    optimizeDeps: { esbuildOptions: { jsx: "automatic" } },
  }),
};
