import assert from "node:assert";
import rsc from "@hiogawa/vite-rsc/plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import inspect from "vite-plugin-inspect";

// log unhandled rejection to debug e2e failures
if (!(globalThis as any).__debugHandlerRegisterd) {
  process.on("uncaughtException", (err) => {
    console.error("⚠️⚠️⚠️ uncaughtException ⚠️⚠️⚠️", err);
  });
  process.on("unhandledRejection", (err) => {
    console.error("⚠️⚠️⚠️ unhandledRejection ⚠️⚠️⚠️", err);
  });
  (globalThis as any).__debugHandlerRegisterd = true;
}

export default defineConfig({
  base: process.env.TEST_BASE ? "/custom-base/" : undefined,
  clearScreen: false,
  plugins: [
    tailwindcss(),
    react(),
    rsc({
      entries: {
        client: "./src/client.tsx",
        ssr: "./src/server.ssr.tsx",
        rsc: "./src/server.tsx",
      },
      // disable auto css injection to manually test `loadCss` feature.
      rscCssTransform: false,
    }),
    // avoid ecosystem CI fail due to vite-plugin-inspect compatibility
    !process.env.ECOSYSTEM_CI && inspect(),
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
      name: "test-server-emitFile-security",
      buildStart() {
        if (this.environment.name === "rsc") {
          this.emitFile({
            type: "asset",
            fileName: "__server_secret.txt",
            source: "__server_secret",
          });
        }
      },
      writeBundle(_options, bundle) {
        if (this.environment.name === "rsc") {
          assert(Object.keys(bundle).includes("__server_secret.txt"));
        } else {
          assert(!Object.keys(bundle).includes("__server_secret.txt"));
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
            source: `\
import handler from './index.js';
export default { fetch: handler };
`,
          });
        }
        if (this.environment.name === "client") {
          // https://developers.cloudflare.com/workers/static-assets/headers/#custom-headers
          this.emitFile({
            type: "asset",
            fileName: "_headers",
            source: `\
/favicon.ico
  Cache-Control: public, max-age=3600, s-maxage=3600
/assets/*
  Cache-Control: public, max-age=31536000, immutable
`,
          });
        }
      },
    },
  ],
  build: {
    minify: false,
  },
  optimizeDeps: {
    exclude: [
      "@vitejs/test-dep-client-in-server/client",
      "@vitejs/test-dep-client-in-server2/client",
      "@vitejs/test-dep-server-in-client/client",
    ],
  },
}) as any;
