import type { Connect, Plugin } from "vite";
import { name as packageName } from "../package.json";

export function vitePluginSsrMiddleware({
  entry,
  entryAlias = "index",
}: {
  entry: string;
  entryAlias?: string;
}): Plugin {
  return {
    name: packageName,

    apply(config, env) {
      // skip client build
      return Boolean(env.command === "serve" || config.build?.ssr);
    },

    config(config, env) {
      if (env.command === "serve") {
        return {
          // disable HTML middlewares (otherwise `req.url` becomes "/index.html")
          appType: "custom",
        };
      }
      if (env.command === "build" && config.build?.ssr) {
        return {
          build: {
            rollupOptions: {
              input: {
                [entryAlias]: entry,
              },
            },
          },
        };
      }
      return;
    },

    configureServer(server) {
      const handler: Connect.NextHandleFunction = async (req, res, next) => {
        try {
          const mod = await server.ssrLoadModule(entry);
          mod["default"](req, res, next);
        } catch (e) {
          next(e);
        }
      };
      return () => server.middlewares.use(handler);
    },
  };
}
