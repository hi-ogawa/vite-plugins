import assert from "node:assert";
import nitro from "@hiogawa/vite-plugin-nitro";
import { toNodeHandler } from "srvx/node";
import { Rollup, defineConfig, isRunnableDevEnvironment } from "vite";

const entries = {
  client: "./src/entry.client.tsx",
  ssr: "./src/entry.server.tsx",
};

const outputBundles: Record<string, Rollup.OutputBundle> = {};

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [
    {
      name: "vite-fullstack",
      config() {
        return {
          builder: {
            sharedConfigBuild: true,
            sharedPlugins: true,
          },
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
        };
      },
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
      async buildApp(builder) {
        await builder.build(builder.environments["client"]!);
        await builder.build(builder.environments["ssr"]!);
      },
      writeBundle(_options, bundle) {
        outputBundles[this.environment.name] = bundle;
      },
      resolveId(source) {
        if (source === 'virtual:assets-manifest') {
          return '\0' + source;
        }
      },
      load(id) {
        if (id === '\0virtual:assets-manifest') {
          if (this.environment.mode === 'dev') {
            const manifest = { entry: entries.client };
            return `export default ${JSON.stringify(manifest)}`;
          }
          const clientBundle = outputBundles['client'];
          assert(clientBundle, 'client bundle not found');
          const entryChunk = Object.values(clientBundle).find(
            (chunk) => chunk.type === 'chunk' && chunk.isEntry,
          );
          assert(entryChunk && entryChunk.type === 'chunk', 'entry chunk not found');
          const manifest = {
            entry: '/' + entryChunk.fileName,
          };
          return `export default ${JSON.stringify(manifest)}`;
        }
      },
    },
    nitro({
      config: {
        preset: "node-server",
      },
    }),
  ],
}));
