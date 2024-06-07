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
        (globalThis as any).__reactServerPrerender = true;
        const posts = await fetchPosts();
        return [
          "/",
          "/counter",
          "/posts",
          ...posts.slice(0, 3).map((p) => `/posts/${p.id}`),
        ];
      },
    }),
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: process.env["SSR_ENTRY"] || "/src/adapters/node.ts",
      preview: path.resolve("dist/server/index.js"),
    }),
  ],
});
