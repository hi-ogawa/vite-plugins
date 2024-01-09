import { vitePluginViteNodeMiniflare } from "@hiogawa/vite-node-miniflare";
import react from "@vitejs/plugin-react";
import { Log } from "miniflare";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  appType: "custom",
  optimizeDeps: {
    // for debugging
    force: true,
  },
  ssr: {
    noExternal: true,
    resolve: {
      // workerd needs "react-dom/server.browser"
      conditions: ["browser", "default"],
    },
    optimizeDeps: {
      noDiscovery: true,
      disabled: false,
      include: ["react", "react/jsx-dev-runtime", "react-dom/server"],
    },
  },
  plugins: [
    vitePluginViteNodeMiniflare({
      debug: true,
      entry: "./src/worker-entry.tsx",
      miniflareOptions(options) {
        options.log = new Log();
      },
      // preBundle: {
      //   include: ["react", "react/jsx-dev-runtime", "react-dom/server"],
      //   force: true,
      // },
    }),
    react(),
    {
      name: "force-ssr-optimize-deps",
      configureServer(server) {
        return async () => {
          // trigger ssr pre-bundling by calling ssrLoadModule for any module
          // https://github.com/vitejs/vite/blob/8ccf7222e9ffaa5e97bd0797de101c8bc6ca8d41/packages/vite/src/node/server/index.ts#L472-L475
          await server.ssrLoadModule("/package.json");
        };
      },
    },
  ],
});
