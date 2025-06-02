import assert from "node:assert";
import { fileURLToPath } from "node:url";
import rsc from "@hiogawa/vite-rsc/plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { type Rollup, defineConfig, normalizePath } from "vite";
import Inspect from "vite-plugin-inspect";

export default defineConfig({
  base: process.env.TEST_BASE ? "/custom-base/" : undefined,
  clearScreen: false,
  plugins: [
    tailwindcss(),
    react(),
    rsc({
      entries: {
        browser: "./src/client.tsx",
        rsc: "./src/server.tsx",
        ssr: "@hiogawa/vite-rsc/extra/ssr",
      },
    }),
    Inspect(),
    {
      name: "show-encryption-key",
      enforce: "post",
      configEnvironment(name, config) {
        if (name === "rsc") {
          console.log(
            "[encryption key]",
            config.define?.__VITE_RSC_ENCRYPTION_KEY__,
          );
        }
      },
    },
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
    {
      name: "optimize-chunks",
      apply: "build",
      config() {
        const resolvePackageSource = (source: string) =>
          normalizePath(fileURLToPath(import.meta.resolve(source)));

        const pkgBrowserPath = resolvePackageSource(
          "@hiogawa/vite-rsc/browser",
        );

        // Non-functional form cannot handle commonjs plugin module
        // e.g. `(id)?commonjs-es-import`
        // manualChunks: {
        //   "lib-react": [
        //     "react",
        //     "react/jsx-runtime",
        //     "react-dom/client",
        //     "react-server-dom-webpack/client.browser",
        //   ],
        // }

        const manualChunksFn: Rollup.ManualChunksOption = (id, meta) => {
          // users can merge client reference chunks by own heuristics
          if (id.startsWith("\0virtual:vite-rsc/build-client-reference/")) {
            const info = meta.getModuleInfo(id)!;
            const originalId = info.importedIds[0]!;
            // e.g. group by directory
            if (originalId.includes("/src/routes/chunks/")) {
              return "rsc-custom";
            }
          }

          // similar to
          // https://github.com/web-infra-dev/rsbuild/blob/main/packages/plugin-react/src/splitChunks.ts
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-server-dom-webpack/")
          ) {
            return "lib-react";
          }

          if (
            id === "\0virtual:vite-rsc/entry-browser" ||
            id === pkgBrowserPath
          ) {
            return "rsc-entry";
          }
        };

        return {
          environments: {
            client: {
              build: {
                manifest: true,
                rollupOptions: {
                  output: {
                    manualChunks: manualChunksFn,
                  },
                },
              },
            },
          },
        };
      },
    },
  ],
  build: {
    minify: false,
  },
}) as any;
