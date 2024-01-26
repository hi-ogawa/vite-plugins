import type { Plugin } from "vite";
import { name as packageName } from "../package.json";

// TODO
export function vitePluginHmr(pluginOpts: { ssr?: boolean }): Plugin {
  pluginOpts;
  return {
    name: packageName,
  };
}
