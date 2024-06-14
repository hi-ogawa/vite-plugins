import path from "node:path";
import { vitePluginReactServer } from "@hiogawa/react-server/plugin";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fetchPosts } from "./src/routes/posts/layout";

export default defineConfig({
  clearScreen: false,
  plugins: [
    react(),
    vitePluginReactServer({
      prerender: async () => {
        process.env["REACT_SERVER_PRERENDER"] = "1";
        const posts = await fetchPosts();
        return [
          "/",
          "/counter",
          "/posts",
          ...posts.slice(0, 3).map((p) => `/posts/${p.id}`),
        ];
      },
      ppr: async () => {
        return ["/ppr"];
      },
    }),
    {
      name: "disable-compression-preview",
      configurePreviewServer(server) {
        server.middlewares.use((req, _res, next) => {
          const url = new URL(req.url || "", "https://preview.local");
          if (url.pathname === "/ppr") {
            // compressions seems to break html streaming
            // https://github.com/vitejs/vite/blob/9f5c59f07aefb1756a37bcb1c0aff24d54288950/packages/vite/src/node/preview.ts#L178
            delete req.headers["accept-encoding"];
          }
          next();
        });
      },
    },
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: process.env["SSR_ENTRY"] || "/src/adapters/node.ts",
      preview: path.resolve("dist/server/index.js"),
    }),
  ],
});
