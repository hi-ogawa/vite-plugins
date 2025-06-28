import assert from "node:assert";
import { fileURLToPath } from "node:url";
import { transformHoistInlineDirective } from "@hiogawa/transforms";
import rsc from "@hiogawa/vite-rsc/plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import {
  type Plugin,
  type Rollup,
  defineConfig,
  normalizePath,
  parseAstAsync,
} from "vite";
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
    vitePluginUseCache(),
    rsc({
      entries: {
        client: "./src/client.tsx",
        ssr: "./src/server.ssr.tsx",
        rsc: "./src/server.tsx",
      },
      // disable auto css injection to manually test `loadCss` feature.
      rscCssTransform: false,
      ignoredPackageWarnings: [/@vitejs\/test-dep-/],
      copyServerAssetsToClient: (fileName) =>
        fileName !== "__server_secret.txt",
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
      name: "test-server-assets-security",
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
    {
      name: "optimize-chunks",
      apply: "build",
      config() {
        const resolvePackageSource = (source: string) =>
          normalizePath(fileURLToPath(import.meta.resolve(source)));

        const pkgBrowserPath = resolvePackageSource(
          "@hiogawa/vite-rsc/react/browser",
        );

        const manualChunksFn: Rollup.ManualChunksOption = (id) => {
          // need to use functional form to handle commonjs plugin proxy module
          // e.g. `(id)?commonjs-es-import`
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes(pkgBrowserPath)
          ) {
            return "lib-react";
          }
        };

        return {
          environments: {
            client: {
              build: {
                manifest: true, // for debugging
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
      // verify chunks are "stable"
      writeBundle(_options, bundle) {
        if (this.environment.name === "client") {
          const entryChunks: Rollup.OutputChunk[] = [];
          const vendorChunks: Rollup.OutputChunk[] = [];
          for (const chunk of Object.values(bundle)) {
            if (chunk.type === "chunk") {
              if (chunk.name === "index") {
                entryChunks.push(chunk);
              } else if (chunk.name === "lib-react") {
                vendorChunks.push(chunk);
              }
            }
          }

          // react vendor chunk has no import
          assert.equal(vendorChunks.length, 1);
          assert.deepEqual(
            vendorChunks[0].imports.filter(
              (f) => !f.includes("rolldown-runtime"),
            ),
            [],
          );
          assert.deepEqual(vendorChunks[0].dynamicImports, []);

          // entry chunk has no export
          assert.equal(entryChunks.length, 1);
          assert.deepEqual(entryChunks[0].exports, []);
        }
      },
    },
  ],
  build: {
    minify: false,
    manifest: true,
  },
  optimizeDeps: {
    exclude: [
      "@vitejs/test-dep-client-in-server/client",
      "@vitejs/test-dep-client-in-server2/client",
      "@vitejs/test-dep-server-in-client/client",
    ],
  },
}) as any;

function vitePluginUseCache(): Plugin[] {
  return [
    {
      name: "use-cache",
      async transform(code) {
        if (!code.includes("use cache")) return;
        const ast = await parseAstAsync(code);
        const result = transformHoistInlineDirective(code, ast, {
          runtime: (value) => `__vite_rsc_cache(${value})`,
          directive: "use cache",
          rejectNonAsyncFunction: true,
          noExport: true,
        });
        if (!result.output.hasChanged()) return;
        result.output.prepend(
          `import __vite_rsc_cache from "/src/use-cache-runtime";`,
        );
        return {
          code: result.output.toString(),
          map: result.output.generateMap({ hires: "boundary" }),
        };
      },
    },
  ];
}
