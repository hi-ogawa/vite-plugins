import process from "node:process";
import globRoutesPlugin from "@hiogawa/vite-glob-routes";
import indexHtmlMiddlewarePlugin from "@hiogawa/vite-index-html-middleware";
import vaviteConnect from "@vavite/connect";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import { defineConfig } from "vite";

export default defineConfig((ctx) => ({
  plugins: [
    // this doesn't matter either
    !ctx.ssrBuild && unocss(),
    react(),
    globRoutesPlugin({ root: "/src/routes" }),
    indexHtmlMiddlewarePlugin(),
    vaviteConnect({
      standalone: false,
      serveClientAssetsInDev: true,
      handlerEntry:
        process.env["SERVER_ENTRY"] ?? "./src/server/adapter-connect.ts",
    }),
  ],
  build: {
    outDir: ctx.ssrBuild ? "dist/server" : "dist/client",
    sourcemap: true,
  },
  clearScreen: false,
}));
