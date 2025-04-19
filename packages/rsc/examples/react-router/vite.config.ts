import path from "node:path";
import { createRequestListener } from "@mjackson/node-fetch-server";
import react from "@vitejs/plugin-react";
import {
  DevEnvironment,
  type Manifest,
  type ResolvedConfig,
  Rollup,
  RunnableDevEnvironment,
  type ViteDevServer,
  defaultServerConditions,
  defineConfig,
} from "vite";

// state for build orchestration
let browserManifest: Manifest;
let browserBundle: Rollup.OutputBundle;
let clientReferences: Record<string, string> = {};
let serverReferences: Record<string, string> = {};
let buildScan = false;
let server: ViteDevServer;
let config: ResolvedConfig;

let vite: {
  server: ViteDevServer;
  client: DevEnvironment;
  ssr: RunnableDevEnvironment;
  rsc: RunnableDevEnvironment;
};

const CLIENT_ENTRY = "/src/entry.browser.tsx";
const SSR_ENTRY = "/src/entry.ssr.tsx";
const RSC_ENTRY = "/src/entry.rsc.tsx";

export default defineConfig({
  clearScreen: false,
  build: {
    minify: false,
  },
  plugins: [
    react(),
    {
      name: "ssr-middleware",
      configureServer(server) {
        vite = {
          server,
          client: server.environments.client,
          ssr: server.environments.ssr as RunnableDevEnvironment,
          rsc: server.environments.rsc as RunnableDevEnvironment,
        };
        (globalThis as any).__viteRscRunner = vite.rsc.runner;
        return () => {
          server.middlewares.use(async (req, res, next) => {
            try {
              const mod = await vite.ssr.runner.import(SSR_ENTRY);
              createRequestListener(mod.default)(req, res);
            } catch (e) {
              next(e);
            }
          });
        };
      },
      // async configurePreviewServer(server) {
      //   const mod = await import(
      //     /* @vite-ignore */ path.resolve("dist/ssr/index.js")
      //   );
      //   return () => {
      //     server.middlewares.use(async (req, res, next) => {
      //       try {
      //         await toNodeHandler(mod.default)(req, res);
      //       } catch (e) {
      //         next(e);
      //       }
      //     });
      //   };
      // },
    },
    {
      // externalize `dist/rsc/...` import as relative path in ssr build
      name: "virtual:import-rsc",
      resolveId(source) {
        if (source === "virtual:vite-rsc/import-rsc") {
          return {
            id: `\0` + source,
            external: this.environment.mode === "build",
          };
        }
      },
      load(id) {
        if (id === "\0virtual:vite-rsc/import-rsc") {
          return `export default () => __viteRscRunner.import(${JSON.stringify(RSC_ENTRY)})`;
        }
      },
      renderChunk(code, chunk) {
        if (code.includes("__VIRTUAL_IMPORT_RSC__")) {
          const replacement = path.relative(
            path.join("dist/ssr", chunk.fileName, ".."),
            path.join("dist/rsc", "index.js"),
          );
          code = code.replace("__VIRTUAL_VITE_RSC_IMPORT_RSC__", replacement);
          return { code };
        }
        return;
      },
    },
  ],
  environments: {
    client: {},
    ssr: {
      build: {
        outDir: "dist/ssr",
        rollupOptions: {
          input: { index: "/src/entry.ssr.ts" },
        },
      },
    },
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
      build: {
        outDir: "dist/rsc",
        rollupOptions: {
          input: { index: "/src/entry.rsc.ts" },
        },
      },
    },
  },
  builder: {
    async buildApp(builder) {
      builder;
    },
  },
}) as any;
