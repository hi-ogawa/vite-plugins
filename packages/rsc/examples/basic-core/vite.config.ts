import rscCore from "@hiogawa/vite-rsc/core/plugin";
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
    {
      name: "use-server-transform",
      transform(code, id) {
        if (/^(("use server")|('use server'))/.test(code)) {
          if (this.environment.name === "rsc") {
            const matches = code.matchAll(/export async function (\w+)\(/g);
            const result = [
              code,
              `import * as $$ReactServer from "@hiogawa/vite-rsc/react/rsc"`,
              ...[...matches].map(
                ([, name]) =>
                  `${name} = $$ReactServer.registerServerReference(${name}, ${JSON.stringify(id)}, ${JSON.stringify(name)})`,
              ),
            ].join(";\n");
            return { code: result, map: null };
          } else {
            const matches = code.matchAll(/export async function (\w+)\(/g);
            const name = this.environment.name === "client" ? "browser" : "ssr";
            const result = [
              `import $$ReactClient from "@hiogawa/vite-rsc/react/${name}"`,
              ...[...matches].map(
                ([, name]) =>
                  `export const ${name} = $$ReactClient.createServerReference(${JSON.stringify(id + "#" + name)})`,
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
        noExternal: ["react", "react-dom", "react-server-dom-vite"],
      },
      optimizeDeps: {
        include: [
          "react",
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
          "react-server-dom-vite/server.edge",
        ],
      },
    },
  },
}) as any;
