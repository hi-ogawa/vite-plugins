import assert from "node:assert";
import nitro from "@hiogawa/vite-plugin-nitro";
import { toNodeHandler } from "srvx/node";
import { defineConfig, isRunnableDevEnvironment } from "vite";

const entries = {
  client: "./src/entry.client.tsx",
  ssr: "./src/entry.server.tsx",
};

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [
    nitro({
      config: {
        preset: "node-server",
      },
    }),
    {
      name: "server-middleware",
      configureServer(server) {
        assert(isRunnableDevEnvironment(server.environments.ssr));
        const runner = server.environments.ssr.runner;
        return () => {
          server.middlewares.use(async (req, res, next) => {
            try {
              const mod = await runner.import(entries.ssr);
              await toNodeHandler(mod.default)(req, res);
            } catch (e) {
              next(e);
            }
          });
        };
      },
    },
  ],
  environments: {
    client: {
      optimizeDeps: {
        entries: [entries.client],
      },
      build: {
        outDir: "./dist/client",
        rollupOptions: {
          input: {
            index: entries.client,
          },
        },
      },
    },
    ssr: {
      build: {
        outDir: "./dist/ssr",
        rollupOptions: {
          input: {
            index: entries.ssr,
          },
        },
      },
    },
  },
  builder: {
    sharedConfigBuild: true,
    sharedPlugins: true,
    async buildApp(builder) {
      await builder.build(builder.environments["client"]!);
      await builder.build(builder.environments["ssr"]!);
    },
  },
}));
