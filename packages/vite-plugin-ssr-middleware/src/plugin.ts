import type { Connect, Plugin } from "vite";
import { name as packageName } from "../package.json";

export function vitePluginSsrMiddleware({
  entry,
  preview,
  mode = "ssrLoadModule",
}: {
  entry: string;
  preview?: string;
  mode?: "ssrLoadModule" | "ViteRuntime" | "ViteRuntime-no-hmr";
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
                index: entry,
              },
            },
          },
        };
      }
      return;
    },

    async configureServer(server) {
      let loadModule = server.ssrLoadModule;
      if (mode === "ViteRuntime" || mode === "ViteRuntime-no-hmr") {
        // @ts-ignore
        const { createViteRuntime, ServerHMRConnector } = await import("vite");
        if (mode === "ViteRuntime") {
          // simple default vite runtime
          const runtime = await createViteRuntime(server);
          loadModule = runtime.executeEntrypoint.bind(runtime);
        } else {
          // manual invalidation mode without hmr
          const runtime = await createViteRuntime(server, { hmr: false });
          const connection = new ServerHMRConnector(server);
          connection.onUpdate(async (payload) => {
            if (payload.type === "update") {
              // unwrapId?
              runtime.moduleCache.invalidateDepTree(
                payload.updates.map((update) => update.path),
              );
            } else if (payload.type === "full-reload") {
              runtime.moduleCache.clear();
            }
          });
          loadModule = runtime.executeEntrypoint.bind(runtime);
        }
      }

      const handler: Connect.NextHandleFunction = async (req, res, next) => {
        // expose ViteDevServer via request
        Object.defineProperty(req, "viteDevServer", { value: server });

        try {
          const mod = await loadModule(entry);
          await mod["default"](req, res, next);
        } catch (e) {
          next(e);
        }
      };
      return () => server.middlewares.use(handler);
    },

    async configurePreviewServer(server) {
      if (preview) {
        const mod = await import(preview);
        return () => server.middlewares.use(mod.default);
      }
      return;
    },
  };
}

// minimal logger inspired by
// https://github.com/koajs/logger
// https://github.com/honojs/hono/blob/25beca878f2662fedd84ed3fbf80c6a515609cea/src/middleware/logger/index.ts

export function vitePluginLogger(): Plugin {
  return {
    name: vitePluginLogger.name,
    configureServer(server) {
      return () => server.middlewares.use(loggerMiddleware());
    },
    configurePreviewServer(server) {
      return () => server.middlewares.use(loggerMiddleware());
    },
  };
}

function loggerMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    const url = new URL(req.originalUrl!, "https://test.local");
    console.log("  -->", req.method, url.pathname);
    const startTime = Date.now();
    res.once("close", () => {
      console.log(
        "  <--",
        req.method,
        url.pathname,
        res.statusCode,
        formatDuration(Date.now() - startTime),
      );
    });
    next();
  };
}

function formatDuration(ms: number) {
  return ms < 1000 ? `${Math.floor(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}
