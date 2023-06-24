import process from "node:process";
import globRoutesPlugin from "@hiogawa/vite-glob-routes";
import indexHtmlMiddlewarePlugin from "@hiogawa/vite-index-html-middleware";
import vaviteConnect from "@vavite/connect";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import { Plugin, defineConfig } from "vite";

export default defineConfig((ctx) => ({
  plugins: [
    unocss(),
    react(),
    globRoutesPlugin({ root: "/src/routes" }),
    indexHtmlMiddlewarePlugin(),
    vaviteConnect({
      standalone: false,
      serveClientAssetsInDev: true,
      handlerEntry:
        process.env["SERVER_ENTRY"] ?? "./src/server/adapter-connect.ts",
    }),
    previewServerPlugin(),
  ],
  build: {
    outDir: ctx.ssrBuild ? "dist/server" : "dist/client",
    sourcemap: true,
  },
  clearScreen: false,
}));

function previewServerPlugin(): Plugin {
  return {
    name: "local:" + previewServerPlugin.name,
    async configurePreviewServer(server) {
      const index = await import("./dist/server/index.js");
      server.middlewares.use(index.default);
    },
  };
}
