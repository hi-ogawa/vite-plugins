import { type Plugin } from "vite";
import { name as packageName } from "../../../package.json";

// TODO

export function vitePluginPreBundle(pluginOptions: {
  include: string[];
  force?: boolean;
}): Plugin {
  let alias!: Record<string, string>;

  return {
    name: `${packageName}/pre-bundle`,
    enforce: "pre",
    async buildStart(options) {
      pluginOptions.include;
      options;
    },
    resolveId(source, _importer, options) {
      return options.ssr ? alias[source] : undefined;
    },
  };
}
