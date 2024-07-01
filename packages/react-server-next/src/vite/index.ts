import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { vitePluginReactServer } from "@hiogawa/react-server/plugin";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import type { Plugin, PluginOption } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { type AdapterType, adapterPlugin } from "./adapters";

export default function vitePluginReactServerNext(options?: {
  plugins?: PluginOption[];
  adapter?: AdapterType;
}): PluginOption {
  return [
    react(),
    tsconfigPaths(),
    vitePluginReactServer({
      routeDir: "app",
      entryBrowser: `next/vite/entry-browser`,
      entryServer: "next/vite/entry-server",
      plugins: [
        tsconfigPaths(),
        {
          // override next.js's default tsconfig `jsx: preserve`
          name: "next-esbuild-jsx",
          config: () => ({
            esbuild: { jsx: "automatic" },
            optimizeDeps: { esbuildOptions: { jsx: "automatic" } },
          }),
        },
        ...(options?.plugins ?? []),
      ],
      // for now, we only enable generateStaticParams for the app route demo
      // https://github.com/hi-ogawa/next-app-router-playground/pull/1
      prerender: (_manifest, presets) => presets.generateStaticParams(),
    }),
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: "next/vite/entry-ssr",
      preview: path.resolve("./dist/server/index.js"),
    }),
    adapterPlugin({ adapter: options?.adapter }),
    appFaviconPlugin(),
    {
      name: "next-exclude-optimize",
      config: () => ({
        ssr: {
          noExternal: ["next"],
        },
        optimizeDeps: {
          exclude: ["next"],
        },
      }),
    },
  ];
}

/** @todo https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons */
function appFaviconPlugin(): Plugin {
  // not sure what exactly Next.js does.
  // for now, let's do quick workaround for app/favicon.ico
  return {
    name: appFaviconPlugin.name,
    apply: (_config, env) => env.command === "serve" || !env.isSsrBuild,
    configureServer(server) {
      if (existsSync("app/favicon.ico")) {
        server.middlewares.use((req, _res, next) => {
          const url = new URL(req.url || "", "https://tmp.local");
          if (url.pathname === "/favicon.ico") {
            req.url = "/app/favicon.ico";
          }
          next();
        });
      }
    },
    generateBundle() {
      if (existsSync("app/favicon.ico")) {
        this.emitFile({
          type: "asset",
          fileName: "favicon.ico",
          source: readFileSync("app/favicon.ico"),
        });
      }
    },
  };
}
