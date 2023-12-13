import { tinyReactVitePlugin } from "@hiogawa/tiny-react/dist/plugins/vite";
import { Log } from "miniflare";
import { defineConfig } from "vite";
import { vitePluginViteNodeMiniflare } from "../dist/index.js";

export default defineConfig({
  clearScreen: false,
  // TODO: force required config from plugin?
  appType: "custom",
  ssr: {
    noExternal: true,
  },
  plugins: [
    vitePluginViteNodeMiniflare({
      debug: true,
      // TODO: must be a relative url for invalidation to work?
      entry: "./src/worker-entry.ts",
      miniflareOptions(options) {
        options.log = new Log();
      },
      viteNodeServerOptions(options) {
        options.debug = {
          dumpModules: true,
        };
      },
      viteNodeRunnerOptions(options) {
        // TODO: vite-node/client debug not working?
        // probably need to set env var DEBUG=vite-node:client:execute
        // https://github.com/vitest-dev/vitest/blob/9c552b6f8decb78677b20e870eb430184e0b78ea/packages/vite-node/src/client.ts#L15
        options.debug = true;
        // options.interopDefault = true;
      },
    }),
    // setup component hmr
    tinyReactVitePlugin(),
  ],
});
