import rscCore from "@hiogawa/vite-rsc/core/plugin";
import { normalizeViteImportAnalysisUrl } from "@hiogawa/vite-rsc/vite-utils";
import { createRequestListener } from "@mjackson/node-fetch-server";
import {
  type RunnableDevEnvironment,
  type ViteDevServer,
  defaultServerConditions,
  defineConfig,
} from "vite";
import type { ModuleRunner } from "vite/module-runner";

let server: ViteDevServer;
let viteSsrRunner: ModuleRunner;
let viteRscRunner: ModuleRunner;

const SERVER_ENTRY = "/src/rsc.tsx";

export default defineConfig({
  clearScreen: false,
  build: {
    minify: false,
  },
  appType: "custom",
  plugins: [
    rscCore(),
    {
      name: "main",
      configureServer(server_) {
        server = server_;
        viteSsrRunner = (server.environments.ssr as RunnableDevEnvironment)
          .runner;
        viteRscRunner = (server.environments.rsc as RunnableDevEnvironment)
          .runner;
        (globalThis as any).__viteSsrRunner = viteSsrRunner;
        return () => {
          server.middlewares.use(async (req, res, next) => {
            try {
              const mod = await viteRscRunner.import(SERVER_ENTRY);
              createRequestListener(mod.default)(req, res);
            } catch (e) {
              next(e);
            }
          });
        };
      },
    },
    {
      name: "use-client-transform",
      transform(code, id) {
        if (this.environment.name === "rsc") {
          if (/^(("use client")|('use client'))/.test(code)) {
            const matches = [
              ...code.matchAll(/export function (\w+)\(/g),
              ...code.matchAll(/export (default) (function|class) /g),
            ];
            id = normalizeViteImportAnalysisUrl(server.environments.client, id);
            const result = [
              `import * as $$ReactServer from "@hiogawa/vite-rsc/react/rsc"`,
              ...[...matches].map(
                ([, name]) =>
                  `export ${name === "default" ? "default" : `const ${name} =`} $$ReactServer.registerClientReference({}, ${JSON.stringify(id)}, ${JSON.stringify(name)})`,
              ),
            ].join(";\n");
            return { code: result, map: null };
          }
        }
      },
    },
  ],
  environments: {
    rsc: {
      resolve: {
        conditions: ["react-server", ...defaultServerConditions],
        noExternal: ["react", "react-dom", "react-server-dom-webpack"],
      },
      optimizeDeps: {
        include: [
          "react",
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
          "react-server-dom-webpack/server.edge",
        ],
      },
    },
  },
}) as any;
