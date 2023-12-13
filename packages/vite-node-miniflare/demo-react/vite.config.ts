import react from "@vitejs/plugin-react";
import { Log } from "miniflare";
import { defineConfig } from "vite";
import { vitePluginViteNodeMiniflare } from "../dist/index.js";

export default defineConfig({
  clearScreen: false,
  appType: "custom",
  optimizeDeps: {
    force: true,
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
    disabled: false,
  },
  ssr: {
    target: "webworker",
    noExternal: true,
    optimizeDeps: {
      disabled: false,
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
      },
      viteNodeRunnerOptions(options) {
        options.interopDefault = true;
      },
      miniflareOptions(options) {
        options.log = new Log();
      },
    }),
    react({ jsxRuntime: "classic" }),
  ],
});
