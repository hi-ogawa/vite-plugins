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
      noAsyncLocalStorage: true,
      prerender: async (_manifest, presets) => {
        return [
          ...(await presets.static()).filter((s) => s !== "/ppr"),
          ...(await presets.generateStaticParams()),
        ];
      },
      ppr: async () => {
        return ["/ppr"];
      },
    }),
    {
      // disable compressions as it breaks html streaming
      // https://github.com/vitejs/vite/blob/9f5c59f07aefb1756a37bcb1c0aff24d54288950/packages/vite/src/node/preview.ts#L178
      name: "no-compression",
      configurePreviewServer(server) {
        server.middlewares.use((req, _res, next) => {
          delete req.headers["accept-encoding"];
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
