import type { Plugin } from "vite";
import { loadEnv } from "vite";

export type VitePluginServerDotenvOptions = {
  /**
   * Environment variable prefixes to expose to the client.
   * @default ["VITE_"]
   */
  envPrefix?: string | string[];
};

// workaround https://github.com/vitejs/vite/issues/17689
(globalThis as any).__vite_server_dotenv_last_env__ ??= [];
declare let __vite_server_dotenv_last_env__: string[];

/**
 * Vite plugin to load environment variables into process.env on the server side.
 * This is a workaround for https://github.com/vitejs/vite/issues/17689 which
 * ensures that environment variables are properly reloaded in dev mode.
 *
 * @param options - Plugin options
 * @returns Vite plugin
 */
export function vitePluginServerDotenv(
  options?: VitePluginServerDotenvOptions,
): Plugin {
  const envPrefix = options?.envPrefix ?? ["VITE_"];
  const envPrefixArray = Array.isArray(envPrefix) ? envPrefix : [envPrefix];

  return {
    name: "vite-plugin-server-dotenv",
    config() {
      // remove last loaded env so that Vite reloads a new value
      for (const key of __vite_server_dotenv_last_env__) {
        delete process.env[key];
      }

      return {
        envPrefix: envPrefixArray,
      };
    },
    configResolved(config) {
      const loadedEnv = loadEnv(config.mode, config.envDir, "");
      __vite_server_dotenv_last_env__ = Object.keys(loadedEnv).filter(
        (key) => !(key in process.env),
      );
      Object.assign(process.env, loadedEnv);
    },
  };
}

export default vitePluginServerDotenv;
