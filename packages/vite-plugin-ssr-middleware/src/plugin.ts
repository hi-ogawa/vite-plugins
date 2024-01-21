import type { Connect, Plugin } from "vite";
import { name as packageName } from "../package.json";

export function vitePluginSsrMiddleware({
  entry,
  entryAlias = "index",
  useViteRuntime,
}: {
  entry: string;
  entryAlias?: string;
  useViteRuntime?: boolean;
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
          // disable builtin HTML middleware, which would rewrite `req.url` to "/index.html"
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

    async configureServer(server) {
      if (useViteRuntime) {
        const vite = await import("vite");
        const runtime = await vite.createViteRuntime(server);
        const handler: Connect.NextHandleFunction = async (req, res, next) => {
          try {
            const mod = await runtime.executeEntrypoint(entry);
            await mod["default"](req, res, next);
          } catch (e) {
            next(e);
          }
        };
        return () => server.middlewares.use(handler);
      }

      const handler: Connect.NextHandleFunction = async (req, res, next) => {
        try {
          const mod = await server.ssrLoadModule(entry);
          await mod["default"](req, res, next);
        } catch (e) {
          next(e);
        }
      };
      return () => server.middlewares.use(handler);
    },
  };
}
