import assert from "node:assert";
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
      },
    }),
    Inspect(),
    {
      // test server restart scenario on e2e
      name: "test-api",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = new URL(req.url!, "http://localhost");
          if (url.pathname === "/__test_restart") {
            setTimeout(() => {
              server.restart();
            }, 10);
            res.end("ok");
            return;
          }
          next();
        });
      },
    },
    {
      name: "test-client-reference-tree-shaking",
      enforce: "post",
      writeBundle(_options, bundle) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type === "chunk") {
            assert(!chunk.code.includes("__unused_client_reference__"));
          }
        }
      },
    },
    {
      name: "cf-build",
      enforce: "post",
      apply: () => !!process.env.CF_BUILD,
      configEnvironment() {
        return {
          keepProcessEnv: false,
          define: {
            "process.env.NO_CSP": "false",
          },
          resolve: {
            noExternal: true,
          },
        };
      },
      generateBundle() {
        if (this.environment.name === "rsc") {
          this.emitFile({
            type: "asset",
            fileName: "cloudflare.js",
            source: `import handler from './index.js'; export default { fetch: handler };`,
          });
        }
      },
    },
  ],
  build: {
    minify: false,
  },
}) as any;
