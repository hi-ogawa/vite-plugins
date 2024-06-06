import fs from "node:fs";
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
      prerender: async () => ["/", "/use-state"],
    }),
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: process.env["SSR_ENTRY"] || "/src/adapters/node.ts",
    }),
    // TODO: expose prerender middleware from plugin
    {
      name: "preview-prerender",
      apply: (_config, env) => !!env.isPreview,
      configurePreviewServer(server) {
        const outDir = server.config.build.outDir;
        server.middlewares.use((req, res, next) => {
          // rewrite url if `index.html` exists
          const url = new URL(req.url!, "https://test.local");
          if (fs.existsSync(path.join(outDir, url.pathname, "index.html"))) {
            if (url.searchParams.has("__rsc")) {
              req.url = path.posix.join(url.pathname, "index.data");
              res.setHeader("content-type", "text/x-component;charset=utf-8");
            } else {
              req.url = path.posix.join(url.pathname, "index.html");
            }
          }
          next();
        });
      },
    },
  ],
});
