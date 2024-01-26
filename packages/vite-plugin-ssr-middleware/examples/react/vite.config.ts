import { vitePluginSsrMiddleware } from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig((env) => ({
  clearScreen: false,
  plugins: [
    react(),
    vitePluginSsrMiddleware({
      entry: "/src/entry-server.tsx",
    }),
    {
      // TODO: move to vitePluginSsrMiddleware? (it's impossible to know ssr build outDir...)
      name: "preview-ssr-middleware",
      async configurePreviewServer(server) {
        // @ts-ignore
        const mod: any = await import("./dist/server/index.js");
        return () => server.middlewares.use(mod.default);
      },
    },
  ],
  build: {
    outDir: env.isSsrBuild ? "dist/server" : "dist/client",
  },
}));
