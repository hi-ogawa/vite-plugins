import type { Plugin } from "vite";
import { esbuildPluginNewUrl, esbuildPluginWorkerNewUrl } from "./esbuild";

export function vitePluginPreBundleNewUrl(): Plugin {
  return {
    name: "pre-bundle-new-url",
    config(config, _env) {
      config.cacheDir;
      return {
        optimizeDeps: {
          esbuildOptions: {
            plugins: [
              esbuildPluginWorkerNewUrl(),
              esbuildPluginNewUrl(),
            ],
          },
        },
      };
    },
    configResolved(config) {
      config.cacheDir;
    },
  };
}
