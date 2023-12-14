import path from "node:path";
import process from "node:process";
import { colors } from "@hiogawa/utils";
import { type Plugin, type ResolvedConfig } from "vite";
import { name as packageName } from "../../../package.json";
import { preBundle } from "./utils";

// TODO: cache

export function vitePluginPreBundle(pluginOptions: {
  include: string[];
}): Plugin {
  let alias: Record<string, string>;
  let config: ResolvedConfig;
  const name = `${packageName}/pre-bundle`;

  return {
    name,
    enforce: "pre",
    configResolved(config_) {
      config = config_;
    },
    async buildStart(_options) {
      config.logger.info(
        ["", colors.cyan(`[${name}] pre-bundling...`)].join("\n")
      );
      const outDir = path.join(
        process.cwd(),
        "node_modules/.cache/@hiogawa/vite-node-miniflare/pre-bundle"
      );
      alias = await preBundle(pluginOptions.include, outDir);
    },
    resolveId(source, _importer, options) {
      return options.ssr ? alias[source] : undefined;
    },
  };
}
