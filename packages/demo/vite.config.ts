import {
  indexHtmlMiddlewarePlugin,
  viteGlobRoutes,
} from "@hiogawa/vite-glob-routes";
import vaviteConnect from "@vavite/connect";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import { defineConfig } from "vite";

// TODO: how to support preview?

export default defineConfig((ctx) => ({
  plugins: [
    unocss(),
    react(),
    viteGlobRoutes({ root: "/src/routes" }),
    indexHtmlMiddlewarePlugin(),
    vaviteConnect({
      standalone: false,
      serveClientAssetsInDev: true,
      handlerEntry:
        ctx.command === "build"
          ? "./src/server/adapter-vercel-edge.ts"
          : "./src/server/adapter-connect.ts",
    }),
  ],
  build: {
    outDir: ctx.ssrBuild ? "dist/server" : "dist/client",
    sourcemap: true,
  },
  clearScreen: false,
}));
