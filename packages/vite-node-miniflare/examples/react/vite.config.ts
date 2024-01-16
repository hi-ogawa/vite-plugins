import { vitePluginViteNodeMiniflare } from "@hiogawa/vite-node-miniflare";
import react from "@vitejs/plugin-react";
import { Log } from "miniflare";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  optimizeDeps: {
    // for debugging
    //   DEBUG=vite:deps pnpm -C examples/react dev
    // force: true,
  },
  ssr: {
    optimizeDeps: {
      include: ["react", "react/jsx-dev-runtime", "react-dom/server.browser"],
      disabled: false, // // disabled for ssr by default
    },
  },
  plugins: [
    vitePluginViteNodeMiniflare({
      debug: true,
      entry: "./src/worker-entry.tsx",
      miniflareOptions(options) {
        options.log = new Log();
      },
    }),
    react(),
  ],
});
