import { vitePluginViteNodeMiniflare } from "@hiogawa/vite-node-miniflare";
import react from "@vitejs/plugin-react";
import { Log } from "miniflare";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  appType: "custom",
  ssr: {
    // Vite injects "require" banner if `target: "node"`
    // https://github.com/hi-ogawa/vite/blob/a3008671de5b44ced2952f796219c0c4576125ac/packages/vite/src/node/optimizer/index.ts#L824-L830
    target: "webworker",
    noExternal: true,
    optimizeDeps: {
      noDiscovery: true,
      disabled: false,
      include: ["react", "react/jsx-dev-runtime", "react-dom/server.browser"],
    },
  },
  plugins: [
    vitePluginViteNodeMiniflare({
      debug: true,
      entry: "./src/worker-entry.tsx",
      miniflareOptions(options) {
        options.log = new Log();
      },
      viteNodeServerOptions(options) {
        // vite-node tries to externalize pre-bundled deps by default.
        // by putting a random cacheDir, it can disable this heuristics.
        // https://github.com/vitest-dev/vitest/blob/043b78f3257b266302cdd68849a76b8ed343bba1/packages/vite-node/src/externalize.ts#L104-L106
        options.deps ??= {};
        options.deps.cacheDir = "__disable_externalizing_vite_deps";
      },
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
