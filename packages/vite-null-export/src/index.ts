import * as esModuleLexer from "es-module-lexer";
import {
  type FilterPattern,
  type Plugin,
  type ResolvedConfig,
  createFilter,
} from "vite";
import { name as packageName } from "../package.json";

// similar to remix's https://github.com/remix-run/remix/blob/80c6842f547b7e83b58f1963894b07ad18c2dfe2/packages/remix-dev/compiler/plugins/emptyModules.ts#L10
// but for vite, we needs to fake esm exports so we use es-module-lexer to extract export names.

export function viteNullExportPlugin(pluginOptions?: {
  clientOnly?: FilterPattern;
  serverOnly?: FilterPattern;
  exclude?: FilterPattern;
  debug?: boolean;
}): Plugin {
  const exclude = pluginOptions?.exclude ?? [
    "**/node_modules/**",
    "**/dist/**",
  ];
  const serverOnly = createFilter(
    pluginOptions?.serverOnly ?? ["**/server/**", "**/*.server.*"],
    exclude
  );
  const clientOnly = createFilter(
    pluginOptions?.clientOnly ?? ["**/client/**", "**/*.client.*"],
    exclude
  );
  let logger!: ResolvedConfig["logger"];

  return {
    // we don't enforce "pre" since es-module-lexer cannot reliably parse typescript file.
    // so we rely on vite's default typescript transpilation.

    name: packageName,

    configResolved(config) {
      logger = config.logger;
    },

    async transform(code, id, options) {
      if (options?.ssr ? clientOnly(id) : serverOnly(id)) {
        if (pluginOptions?.debug) {
          logger.info(
            `[DEBUG:${packageName}:${
              options?.ssr ? "clientOnly" : "serverOnly"
            }] ${id}`
          );
        }
        await esModuleLexer.init;
        const [_import, exports] = esModuleLexer.parse(code);
        return exports
          .map((e) =>
            e.n === "default"
              ? `export default null;\n`
              : `export var ${e.n} = null;\n`
          )
          .join("");
      }
      return undefined;
    },
  };
}
