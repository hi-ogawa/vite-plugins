import { vitePluginRscCore } from "@hiogawa/vite-rsc/core/plugin";
import react from "@vitejs/plugin-react";
import {
  RunnableDevEnvironment,
  defaultServerConditions,
  defineConfig,
} from "vite";

export default defineConfig({
  clearScreen: false,
  appType: "custom",
  plugins: [
    react(),
    vitePluginRscCore({
      getClientReferences: () => ({}),
      getServerReferences: () => ({}),
    }),
    {
      name: "ssr-middleware",
      configureServer(server) {
        return () => {
          server.middlewares.use(async (req, res, next) => {
            try {
              const mod = await (
                server.environments.ssr as RunnableDevEnvironment
              ).runner.import("/src/entry-server.tsx");
              await mod.default(req, res);
            } catch (e) {
              next(e);
            }
          });
        };
      },
    },
  ],
  environments: {
    ssr: {
      resolve: {
        conditions: ["react-server", ...defaultServerConditions],
        noExternal: true,
      },
      optimizeDeps: {
        include: [
          "react",
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
          `react-server-dom-webpack/server`,
        ],
        exclude: ["util"],
      },
    },
  },
  build: {
    minify: false,
  },
}) as any;
