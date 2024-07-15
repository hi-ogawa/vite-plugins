import path from "node:path";
import { vitePluginReactServer } from "@hiogawa/react-server/plugin";
import { vitePluginErrorOverlay } from "@hiogawa/vite-plugin-error-overlay";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import { type Plugin, defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  plugins: [
    process.env["USE_SWC"]
      ? (await import("@vitejs/plugin-react-swc".slice())).default()
      : react(),
    unocss(),
    !process.env["E2E"] &&
      vitePluginErrorOverlay({
        patchConsoleError: true,
      }),
    vitePluginReactServer({
      entryBrowser: "/src/entry-browser",
      entryServer: "/src/entry-server",
      plugins: [
        testVitePluginVirtual(),
        {
          name: "cusotm-react-server-config",
          config() {
            return {
              build: {
                assetsInlineLimit(filePath) {
                  // test non-inlined server asset
                  return !filePath.includes("/test/assets/");
                },
              },
            };
          },
        },
      ],
    }),
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: process.env["SSR_ENTRY"] || "/src/adapters/node.ts",
      preview: path.resolve("./dist/server/index.js"),
    }),
    {
      // disable compressions as it breaks html streaming
      // https://github.com/vitejs/vite/blob/9f5c59f07aefb1756a37bcb1c0aff24d54288950/packages/vite/src/node/preview.ts#L178
      name: "no-compression",
      configurePreviewServer(server) {
        server.middlewares.use((req, _res, next) => {
          delete req.headers["accept-encoding"];
          next();
        });
      },
    },
    testVitePluginVirtual(),
  ],
  ssr: {
    noExternal: [
      // cjs default export. try
      //   node -e 'import("react-wrap-balancer").then(console.log)'
      //   https://publint.dev/react-wrap-balancer@1.1.0
      "react-wrap-balancer",
      // css import
      "react-tweet",
    ],
  },
});

function testVitePluginVirtual(): Plugin {
  return {
    name: "test:" + testVitePluginVirtual.name,
    resolveId(source, _importer, _options) {
      if (source === "virtual:test-use-client") {
        return "\0" + source;
      }
      return;
    },
    load(id, _options) {
      if (id === "\0virtual:test-use-client") {
        return /* js */ `
          "use client";
          export function TestVirtualUseClient() {
            return "TestVirtualUseClient";
          }
        `.trimStart();
      }
      return;
    },
  };
}
