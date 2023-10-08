import process from "node:process";
import globRoutesPlugin from "@hiogawa/vite-glob-routes";
import { importDevServerPlugin } from "@hiogawa/vite-import-dev-server";
import { viteNullExportPlugin } from "@hiogawa/vite-null-export";
import vaviteConnect from "@vavite/connect";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import { defineConfig } from "vite";

export default defineConfig((ctx) => ({
  plugins: [
    react(),
    unocss(),
    importDevServerPlugin(),
    globRoutesPlugin({ root: "/src/routes" }),
    vaviteConnect({
      standalone: false,
      serveClientAssetsInDev: true,
      handlerEntry:
        process.env["SERVER_ENTRY"] ?? "./src/server/adapter-connect.ts",
    }),
    viteNullExportPlugin({ debug: true }),
  ],
  build: {
    outDir: ctx.ssrBuild ? "dist/server" : "dist/client",
    manifest: true,
    sourcemap: true,
  },
  server: process.env["PORT"]
    ? {
        port: Number(process.env["PORT"]),
        strictPort: true,
      }
    : undefined,
  clearScreen: false,
}));
