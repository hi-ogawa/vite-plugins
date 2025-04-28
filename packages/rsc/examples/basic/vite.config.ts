import fs from "node:fs";
import { fileURLToPath } from "node:url";
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
          if (url.pathname === "/__findSourceMapURL") {
            res.setHeader("content-type", "application/json");
            let filename = url.searchParams.get("filename")!;
            if (filename.startsWith("file://")) {
              filename = fileURLToPath(filename);
            }
            const mod =
              server.environments.rsc.moduleGraph.getModuleById(filename);
            const map = mod?.transformResult?.map;
            if (map) {
              res.end(JSON.stringify(map));
            } else if (fs.existsSync(filename)) {
              // line-by-line identity source map
              const content = fs.readFileSync(filename, "utf-8");
              res.end(
                JSON.stringify({
                  version: 3,
                  sources: [filename],
                  sourcesContent: [content],
                  mappings: "AAAA" + ";AACA".repeat(content.split("\n").length),
                }),
              );
            } else {
              res.statusCode = 404;
              res.end("{}");
            }
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
