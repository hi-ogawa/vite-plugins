import { createFilter, type FilterPattern, type Plugin } from "vite";
import { name as packageName } from "../package.json";
import { hmrTransform } from "./transform";

export function vitePluginSimpleHmr(pluginOpts: {
  include?: FilterPattern;
  exclude?: FilterPattern;
}): Plugin {
  const filter = createFilter(
    pluginOpts.include,
    pluginOpts.exclude ?? ["**/node_modules/**"],
  );

  return {
    name: packageName,
    apply: "serve",
    transform(code, id, options) {
      if (options?.ssr && filter(id)) {
        return hmrTransform(code);
      }
      return;
    },
  };
}
