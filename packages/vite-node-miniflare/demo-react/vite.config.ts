import react from "@vitejs/plugin-react";
import { Log } from "miniflare";
import { defineConfig } from "vite";
import { vitePluginViteNodeMiniflare } from "../dist/index.js";

export default defineConfig({
  clearScreen: false,
  appType: "custom",
  optimizeDeps: {
    // force: true,
    include: [
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom/client",
      "react-dom/server.browser",
    ],
    needsInterop: [
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom/client",
      "react-dom/server.browser",
    ],
  },
  ssr: {
    // target: "webworker",
    noExternal: true,
    optimizeDeps: {
      include: [
        "react",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom/client",
        "react-dom/server.browser",
      ],
      needsInterop: [
        "react",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom/client",
        "react-dom/server.browser",
      ],
    },
  },
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
  plugins: [
    vitePluginViteNodeMiniflare({
      debug: true,
      entry: "./src/worker-entry.tsx",
      viteNodeServerOptions(options) {
        options.debug = {
          dumpModules: true,
        };
        // options.deps = {
        //   inline: true,
        // }
        // options.transformMode = { web: [/react\/jsx-dev-runtime/] };
        options.transformMode = { web: [/.*/] };
      },
      miniflareOptions(options) {
        options.log = new Log();
      },
    }),
    react(),
  ],
});
