import { vitePluginReactServer } from "@hiogawa/react-server/plugin";
import { vitePluginSsrMiddleware } from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig((env) => ({
  clearScreen: false,
  plugins: [
    react(),
    vitePluginReactServer(),
    vitePluginSsrMiddleware({
      entry: process.env["SSR_ENTRY"] || "/src/adapters/node.ts",
    }),
    {
      name: "preview-ssr-middleware",
      async configurePreviewServer(server) {
        // "slice" to avoid esbuild crash when transpiling vite.config.ts
        const mod = await import("./dist/server/index.js".slice());
        return () => server.middlewares.use(mod.default);
      },
    },
  ],
  // TODO: move to plugin
  build: {
    outDir: env.isSsrBuild ? "dist/server" : "dist/client",
  },
}));
