import fs from "node:fs";
import path from "node:path";
import { vitePluginReactServer } from "@hiogawa/react-server/plugin";
import { vitePluginErrorOverlay } from "@hiogawa/vite-plugin-error-overlay";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import MagicString from "magic-string";
import unocss from "unocss/vite";
import { type ConfigEnv, type Plugin, defineConfig } from "vite";

export default defineConfig(async (env) => ({
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
        // TODO: for now mdx is server only.
        // see https://mdxjs.com/docs/getting-started/#vite for how to setup client hmr.
        mdx(),
        testVitePluginVirtual(),
        wasmModulePlugin({
          mode:
            env.command === "serve"
              ? "asset-fs"
              : process.env.CF_PAGES
                ? "asset-import"
                : "inline",
        }),
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
    wasmModulePlugin({
      mode: process.env.CF_PAGES ? "asset-import" : "inline",
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
    } satisfies Plugin,
    testVitePluginVirtual(),
  ],
  build: {
    ssrEmitAssets: true,
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
}));

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

// normalize wasm import based on environments
// - CF: keep import "xxx.wasm"
// - Vercel edge: rewrite to import "xxx.wasm?module"
// - Others: replace it with explicit instantiation of `WebAssembly.Module`
//   - inline
//   - local asset + fs.readFile
// https://developers.cloudflare.com/pages/functions/module-support/#webassembly-modules
// https://github.com/withastro/adapters/blob/cd4c0842aadc58defc67f4ccf6d6ef6f0401a9ac/packages/cloudflare/src/utils/cloudflare-module-loader.ts#L213-L216
// https://vercel.com/docs/functions/wasm
// https://github.com/unjs/unwasm
function wasmModulePlugin(options: {
  mode: "inline" | "asset-fs" | "asset-import";
}): Plugin {
  let env: ConfigEnv;
  return {
    name: wasmModulePlugin.name,
    config(_config, env_) {
      env = env_;
    },
    load(id) {
      if (id.endsWith(".wasm")) {
        // inline + WebAssembly.Module
        if (options.mode === "inline") {
          const base64 = fs.readFileSync(id).toString("base64");
          return `
            const buffer = Uint8Array.from(atob("${base64}"), c => c.charCodeAt(0));
            export default new WebAssembly.Module(buffer);
          `;
        }

        // file + WebAssembly.Module
        if (options.mode === "asset-fs") {
          if (env.command === "build") {
            this.emitFile;
          }
          return `
            import fs from "node:fs";
            const buffer = fs.readFileSync(${JSON.stringify(id)});
            export default new WebAssembly.Module(buffer);
          `;
        }

        // keep wasm import
        if (options.mode === "asset-import") {
          if (env.command === "build") {
            const referenceId = this.emitFile({
              type: "asset",
              name: path.basename(id),
              source: fs.readFileSync(id),
            });
            // temporary placeholder replaced during renderChunk
            return `export default "__WASM_IMPORT_URL_${referenceId}"`;
          }
        }
      }
    },
    renderChunk(code, chunk) {
      const matches = code.matchAll(/"__WASM_IMPORT_URL_(\w+)"/dg);
      const output = new MagicString(code);
      for (const match of matches) {
        const referenceId = match[1];
        const assetFileName = this.getFileName(referenceId);
        const importSource =
          "./" +
          path.relative(
            path.resolve(chunk.fileName, ".."),
            path.resolve(assetFileName),
          );
        const importName = `__wasm_${referenceId}`;
        const [start, end] = match.indices![0];
        output.prepend(`import ${importName} from "${importSource}";\n`);
        output.update(start, end, importName);
      }
      if (output.hasChanged()) {
        return output.toString();
      }
    },
  };
}
