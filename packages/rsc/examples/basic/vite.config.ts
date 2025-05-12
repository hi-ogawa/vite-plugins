import assert from "node:assert";
import rsc from "@hiogawa/vite-rsc/plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, createBuilder } from "vite";
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
      config(config) {
        const buildApp = config.builder!.buildApp!;
        return {
          builder: {
            async buildApp(builder) {
              await buildApp(builder);

              // bundle server again for cf deployment
              // const cfBuilder = await createBuilder({
              //   configFile: false,
              //   envDir: false,
              //   publicDir: false,
              //   environments: {
              //     ssr: {
              //       resolve: {
              //         noExternal: true,
              //       },
              //       build: {
              //         outDir: 'dist/cf',
              //         rollupOptions: {
              //           input: {
              //             index: 'dist/rsc/index.js'
              //           },
              //           // output: {
              //           //   inlineDynamicImports: true,
              //           // }
              //         }
              //       },
              //     }
              //   },
              // });
              // await cfBuilder.build(cfBuilder.environments.ssr);
            },
          }
        }
      },
    }
  ],
  build: {
    minify: false,
  },
}) as any;
