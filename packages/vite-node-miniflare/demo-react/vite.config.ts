import react from "@vitejs/plugin-react";
import { Log } from "miniflare";
import { defineConfig } from "vite";
import { vitePluginViteNodeMiniflare } from "../dist/index.js";

const preBundles = [
  "react",
  "react/jsx-dev-runtime",
  "react-dom/server",
];
const preBundleAlias = Object.fromEntries(
  preBundles.map((mod) => [
    mod,
    new URL(`../pre-bundle/dist/${mod}/index.js`, import.meta.url).pathname,
  ])
);

export default defineConfig({
  clearScreen: false,
  appType: "custom",
  ssr: {
    target: "webworker",
    noExternal: true,
  },
  plugins: [
    {
      name: "local:ssrPrebundlePlugin",
      enforce: "pre",
      apply: "serve",
      resolveId(source, _importer, options) {
        return options.ssr ? preBundleAlias[source] : undefined;
      },
    },
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
