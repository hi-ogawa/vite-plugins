import {
  vitePluginPreBundle,
  vitePluginViteNodeMiniflare,
} from "@hiogawa/vite-node-miniflare";
import { unstable_vitePlugin as remix } from "@remix-run/dev";
import { Log } from "miniflare";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  plugins: [
    vitePluginPreBundle({
      include: ["react", "react/jsx-dev-runtime", "react-dom", "react-dom/server.browser"],
    }),
    vitePluginViteNodeMiniflare({
      debug: true,
      entry: "./app/worker-entry-wrapper.ts",
      miniflareOptions(options) {
        options.log = new Log();
      },
      viteNodeServerOptions(options) {
        // TODO: I thought this is the default of vite-node...?
        options.transformMode = {
          ssr: [/.*/]
        };
      },
    }),
    remix(),
    {
      name: "debug-something",
      enforce: "post",
      config(config, env) {
        // DEBUG=vite:deps,vite:transform

        // console.log(":: config.optimizeDeps", config.optimizeDeps);
        // console.log(":: config.ssr", config.ssr);
        config.optimizeDeps = {
          disabled: true,
        };
        (config.ssr ??= {}).optimizeDeps = {
          disabled: true,
        };
        (config.server ??= {}).preTransformRequests = false;
      },
    },
  ],
  ssr: {
    noExternal: true,
  },
});
