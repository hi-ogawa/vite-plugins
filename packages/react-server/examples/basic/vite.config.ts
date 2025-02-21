import path from "node:path";
import {
  vitePluginReactServer,
  wrapClientPlugin,
  wrapServerPlugin,
} from "@hiogawa/react-server/plugin";
import { vitePluginErrorOverlay } from "@hiogawa/vite-plugin-error-overlay";
import { vitePluginWasmModule } from "@hiogawa/vite-plugin-server-asset";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import { type Plugin, defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  plugins: [
    // TODO: for now mdx is server only.
    // see https://mdxjs.com/docs/getting-started/#vite for how to setup client hmr.
    mdx(),
    process.env["USE_SWC"]
      ? (await import("@vitejs/plugin-react-swc".slice())).default()
      : react(),
    // TODO: remove from ssr build
    wrapClientPlugin(unocss()),
    !process.env["E2E"] &&
      vitePluginErrorOverlay({
        patchConsoleError: true,
      }),
    vitePluginReactServer({
      entryBrowser: "/src/entry-browser",
      entryServer: "/src/entry-server",
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
    wrapServerPlugin([
      vitePluginWasmModule({
        buildMode: process.env.VERCEL || process.env.CF_PAGES ? "import" : "fs",
      }),
    ]),
    {
      // external require polyfill prevents adapter-level bundling,
      // but since rolldown is fast, we can simply go `noExternal: true`.
      // cf. https://github.com/hi-ogawa/reproductions/tree/main/rolldown-vite-require-react-polyfill
      name: "avoid-require-polyfill",
      apply: "build",
      configEnvironment(name) {
        if (name === "ssr") {
          return {
            resolve: {
              noExternal: true,
            },
          };
        }
      },
    },
  ],
  build: {
    ssrEmitAssets: true,
    assetsInlineLimit(filePath) {
      // test non-inlined server asset
      return !filePath.includes("/test/assets/");
    },
  },
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
  envPrefix: "MY_PREFIX_",
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
