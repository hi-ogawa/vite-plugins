import react from "@vitejs/plugin-react";
import { Log } from "miniflare";
import { defineConfig } from "vite";
import {
  vitePluginPreBundle,
  vitePluginViteNodeMiniflare,
} from "../dist/index.js";

export default defineConfig({
  clearScreen: false,
  appType: "custom",
  ssr: {
    target: "webworker",
    noExternal: true,
  },
  plugins: [
    vitePluginPreBundle({
      include: ["react", "react/jsx-dev-runtime", "react-dom/server"],
    }),
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
    react(),
  ],
});
