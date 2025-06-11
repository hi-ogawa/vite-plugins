import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig, mergeConfig } from "vite";
import baseConfig from "../vite.config.ts";

const cfConfig = defineConfig({
  plugins: [
    cloudflare({
      configPath: "./cf/wrangler.ssr.jsonc",
      viteEnvironment: {
        name: "ssr",
      },
      auxiliaryWorkers: [
        {
          configPath: "./cf/wrangler.rsc.jsonc",
          viteEnvironment: {
            name: "rsc",
          },
        },
      ],
    }),
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

        // overwrite server entries
        // TODO: better plugin API to customize?
        (config.environments as any).ssr.build.rollupOptions.input.index =
          "./cf/entry.ssr.tsx";
        (config.environments as any).rsc.build.rollupOptions.input.index =
          "./cf/entry.rsc.tsx";
      },
      configEnvironment(name) {
        if (name !== "client") {
          return {
            build: {
              rollupOptions: {
                // avoid "node:module" from "rolldown:runtime"
                platform: "neutral",
              },
            },
          };
        }
      },
    },
  ],
  environments: {
    ssr: {
      optimizeDeps: {
        include: [
          "react",
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
          "react-dom",
          "react-dom/server.edge",
        ],
      },
    },
    rsc: {
      optimizeDeps: {
        include: ["react-router"],
      },
    },
  },
});

export default mergeConfig(cfConfig, baseConfig) as any;
