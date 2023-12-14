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
      include: [
        "react",
        "react/jsx-dev-runtime",
        "react-dom",
        "react-dom/server.browser",
      ],
    }),
    vitePluginViteNodeMiniflare({
      debug: true,
      entry: "./app/worker-entry-wrapper.ts",
      miniflareOptions(options) {
        options.log = new Log();
        // TODO: set sensible default from plugin?
        // > Error: To use the new ReadableStream() constructor, enable the streams_enable_constructors compatibility flag. Refer to the docs for more information: https://developers.cloudflare.com/workers/platform/compatibility-dates/#compatibility-flags
        // @ts-ignore
        options.compatibilityFlags = ["streams_enable_constructors"];
      },
      viteNodeServerOptions(options) {
        // TODO: I thought this is the default of vite-node...?
        options.transformMode = {
          ssr: [/.*/],
        };
      },
    }),
    remix(),
  ],
  ssr: {
    noExternal: true,
  },
});
