import { cloudflare } from "@cloudflare/vite-plugin";
import rsc from "@hiogawa/vite-rsc/plugin";
import { createRequestListener } from "@mjackson/node-fetch-server";
import react from "@vitejs/plugin-react";
import { RunnableDevEnvironment, defineConfig } from "vite";
import { createRpcServer } from "./src/framework/rpc";

export default defineConfig((_env) => ({
  clearScreen: false,
  build: {
    minify: false,
  },
  plugins: [
    react(),
    rsc({
      entries: {
        client: "./src/framework/entry.browser.tsx",
        ssr: "./src/framework/entry.ssr.tsx",
      },
      serverHandler: false,
    }),
    cloudflare({
      configPath: "./wrangler.jsonc",
      viteEnvironment: {
        name: "rsc",
      },
    }),
    {
      name: "vite-rsc-environment-rpc-proxy",
      configureServer(server) {
        // expose `renderHTML` of node ssr environment through
        // this special endpoint for cloudflare rsc environment during dev.
        const environmentRunnerProxy = new Proxy(
          {},
          {
            get(_target, p, _receiver) {
              if (typeof p !== "string" || p === "then") {
                return;
              }
              return async (...args: any[]) => {
                // TODO: parametrize
                // - environmentName
                // - entryName
                const ssrRunner = (
                  server.environments.ssr as RunnableDevEnvironment
                ).runner;
                const module = await ssrRunner.import(
                  "./src/framework/entry.ssr.tsx",
                );
                return (module as any)[p](...args);
              };
            },
          },
        );
        const rpcHandler = createRequestListener(
          createRpcServer(environmentRunnerProxy),
        );

        server.middlewares.use(async (req, res, next) => {
          if (req.url === "/__vite_rsc_environment_proxy") {
            rpcHandler(req, res);
            return;
          }
          next();
        });
      },
    },
    {
      name: "fix-up",
      enforce: "post",
      config(config) {
        // TODO: cloudflare should allow optimizeDeps.exclude for esm packages?
        // for now we patch out https://github.com/cloudflare/workers-sdk/blob/33830214ff76ec4738b3e998370eca7568240e12/packages/vite-plugin-cloudflare/src/index.ts#L197
        const plugin = config
          .plugins!.flat()
          .find((p) => p && "name" in p && p.name === "vite-plugin-cloudflare");
        const original = (plugin as any).configResolved;
        (plugin as any).configResolved = function (this: any, ...args: any[]) {
          try {
            return original.apply(this, args);
          } catch (e) {
            console.log(
              "[patched cloudflare plugin error]",
              e instanceof Error ? e.message : e,
            );
          }
        };

        // workaround (fixed in Vite 7) https://github.com/vitejs/vite/pull/20077
        (config.environments as any).ssr.resolve.noExternal = true;
        (config.environments as any).rsc.resolve.noExternal = true;
      },
    },
  ],
  environments: {
    rsc: {
      build: {
        rollupOptions: {
          // ensure `default` export only in cloudflare entry output
          preserveEntrySignatures: "exports-only",
        },
      },
    },
    ssr: {
      keepProcessEnv: false,
      build: {
        // build `ssr` inside `rsc` directory so that
        // wrangler can deploy self-contained `dist/rsc`
        outDir: "./dist/rsc/ssr",
      },
    },
  },
}));
