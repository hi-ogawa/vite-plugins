import rsc from "@hiogawa/vite-rsc/plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import Inspect from "vite-plugin-inspect";

export default defineConfig({
  base: process.env.TEST_BASE ? "/custom-base/" : undefined,
  clearScreen: false,
  plugins: [
    tailwindcss(),
    react(),
    rsc({
      entries: {
        browser: "/src/client.tsx",
        rsc: "/src/server.tsx",
        ssr: "@hiogawa/vite-rsc/extra/ssr",
        css: "/src/styles.css",
      },
    }),
    Inspect(),
    {
      name: "rsc:middleware-findSourceMapURL",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = new URL(req.url!, `http://localhost`);
          if (url.pathname === "/__vite_rsc_findSourceMapUrl") {
            const filename = url.searchParams.get("filename")!;
            const mod =
              server.environments.rsc.moduleGraph.getModuleById(filename);
            const map = mod?.transformResult?.map;
            if (!map) {
              res.statusCode = 404;
              res.end("Not found");
              return;
            }
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(map));
            return;
          }
          next();
        });
      },
    },
  ],
  build: {
    minify: false,
  },
}) as any;
