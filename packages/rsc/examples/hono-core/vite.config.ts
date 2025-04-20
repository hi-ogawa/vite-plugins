import path from "node:path";
import { getRequestListener } from "@hono/node-server";
import react from "@vitejs/plugin-react";
import { defaultServerConditions, defineConfig } from "vite";

const SERVER_ENTRY = "/src/server.tsx";

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
        server.middlewares.use(async (req, res, next) => {
          const url = new URL(req.url ?? "", "http://localhost");
          if (url.pathname.startsWith("/api/")) {
            try {
              const mod = await server.ssrLoadModule(SERVER_ENTRY);
              getRequestListener(mod.default.fetch)(req, res);
              return;
            } catch (e) {
              next(e);
            }
          }
          next();
        });
      },
      async configurePreviewServer(server) {
        const mod = await import(path.resolve("dist/ssr/index.js"));
        server.middlewares.use(async (req, res, next) => {
          const url = new URL(req.url ?? "", "http://localhost");
          if (url.pathname.startsWith("/api/")) {
            try {
              getRequestListener(mod.default.fetch)(req, res);
              return;
            } catch (e) {
              next(e);
            }
          }
          next();
        });
      },
    },
  ],
  environments: {
    client: {
      build: {
        outDir: "dist/client",
      },
    },
    ssr: {
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
        outDir: "dist/ssr",
        rollupOptions: {
          input: { index: SERVER_ENTRY },
        },
      },
    },
  },
}) as any;
