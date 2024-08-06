import type { Plugin } from "vite";

export function vitePluginPreBundleNewUrl(): Plugin {
  return {
    name: "pre-bundle-new-url",
    config(config, _env) {
      config.cacheDir;
      return {
        optimizeDeps: {
          esbuildOptions: {
            // TODO
            plugins: [],
          },
        },
      };
    },
  };
}
