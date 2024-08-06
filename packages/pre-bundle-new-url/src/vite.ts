import type { Plugin } from "vite";
import { esbuildPluginNewUrl, esbuildPluginWorkerNewUrl } from "./esbuild";

export function vitePluginPreBundleNewUrl(): Plugin {
  return {
    name: "pre-bundle-new-url",
    config(config, _env) {
      config.cacheDir;
      esbuildPluginNewUrl;
      esbuildPluginWorkerNewUrl;
      return {
        optimizeDeps: {
          esbuildOptions: {
            // TODO
            plugins: [],
          },
        },
      };
    },
    configResolved(config) {
      config.cacheDir;
    },
  };
}
