import process from "node:process";
import globRoutesPlugin from "@hiogawa/vite-glob-routes";
import { importDevServerPlugin } from "@hiogawa/vite-import-dev-server";
import { viteNullExportPlugin } from "@hiogawa/vite-null-export";
import { vitePluginSsrMiddleware } from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import { type Plugin, ViteDevServer, defineConfig } from "vite";

export default defineConfig((ctx) => ({
  plugins: [
    react(),
    unocss(),
    importDevServerPlugin(),
    globRoutesPlugin({ root: "/src/routes" }),
    vitePluginSsrMiddleware({
      entry: process.env["SERVER_ENTRY"] ?? "./src/server/adapter-node.ts",
    }),
    vitePluginSsrInlineCss({
      entry: "virtual:uno.css",
    }),
    viteNullExportPlugin({
      serverOnly: "**/server/**",
      debug: true,
    }),
  ],
  build: {
    outDir: ctx.isSsrBuild ? "dist/server" : "dist/client",
    manifest: ".vite/manifest.json", // explicit manifest path for v4/v5 compat
    sourcemap: true,
  },
  server: process.env["PORT"]
    ? {
        port: Number(process.env["PORT"]),
        strictPort: true,
      }
    : undefined,
  clearScreen: false,
}));

// for now, this supports only tailwind-like single css entry use case.
// maybe it can be generalized to support more intricate style collection.
// cf. https://github.com/remix-run/remix/blob/1a8a5216106bd8c3073cc3e5e5399a32c981db74/packages/remix-dev/vite/styles.ts
function vitePluginSsrInlineCss(pluginOpts: { entry: string }): Plugin {
  let server: ViteDevServer;

  return {
    name: "local:" + vitePluginSsrInlineCss.name,
    apply(_config, env) {
      return env.command === "serve";
    },
    configureServer(_server) {
      server = _server;
    },
    transformIndexHtml: {
      handler: async () => {
        const mod = await server.ssrLoadModule(pluginOpts.entry);
        return [
          {
            tag: "style",
            injectTo: "head",
            attrs: { [SSR_INLINE_CSS_ATTR]: true },
            children: mod.default as string,
          },
          {
            tag: "script",
            injectTo: "head",
            attrs: { type: "module" },
            children: SSR_INLINE_CSS_SCRIPT,
          },
        ];
      },
    },
  };
}

const SSR_INLINE_CSS_ATTR = "data-vite-ssr-inline-css";

// script to clear inlined css after first hot update
// since vite should take care css during dev
const SSR_INLINE_CSS_SCRIPT = /* js */ `

import { createHotContext } from "/@vite/client";

// instantiate import.meta.hot with dummy file
const hot = createHotContext("/__dummy__${vitePluginSsrInlineCss.name}");

// https://vitejs.dev/guide/api-hmr.html#hot-on-event-cb
hot.on("vite:afterUpdate", clearCss);

function clearCss() {
  hot.off("vite:afterUpdate", clearCss);

  document.querySelectorAll("${SSR_INLINE_CSS_ATTR}").forEach(node => {
    node.remove();
  });
}

`;
