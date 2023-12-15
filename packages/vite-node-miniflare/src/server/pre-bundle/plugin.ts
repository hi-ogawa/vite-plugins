import path from "node:path";
import process from "node:process";
import { colors } from "@hiogawa/utils";
import { type Plugin, type ResolvedConfig } from "vite";
import { name as packageName } from "../../../package.json";
import { PreBundler } from "./utils";

// TODO: include this plugin in main one vitePluginViteNodeMiniflare via preBundle options?

export function vitePluginPreBundle(pluginOptions: {
  include: string[];
  force?: boolean;
}): Plugin {
  const name = `${packageName}/pre-bundle`;
  let config: ResolvedConfig;
  let preBundler: PreBundler;

  return {
    name,
    enforce: "pre",
    configResolved(config_) {
      config = config_;
    },
    async buildStart(_options) {
      const outDir = path.join(
        process.cwd(),
        "node_modules/.cache/@hiogawa/vite-node-miniflare/pre-bundle"
      );
      preBundler = new PreBundler(pluginOptions.include, outDir);
      if (preBundler.isCached()) {
        return;
      }
      config.logger.info(
        ["", colors.cyan(`[${name}] pre-bundling...`)].join("\n")
      );
      await preBundler.run();
    },
    resolveId(source, _importer, options) {
      return options.ssr ? preBundler.alias[source] : undefined;
    },
  };
}
