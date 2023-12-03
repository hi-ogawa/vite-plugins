import process from "node:process";
import globRoutesPlugin from "@hiogawa/vite-glob-routes";
import { importDevServerPlugin } from "@hiogawa/vite-import-dev-server";
import { viteNullExportPlugin } from "@hiogawa/vite-null-export";
import { vitePluginSsrMiddleware } from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import {
  HtmlTagDescriptor,
  type Plugin,
  ViteDevServer,
  defineConfig,
} from "vite";

export default defineConfig((ctx) => ({
  plugins: [
    react(),
    unocss(),
    importDevServerPlugin(),
    globRoutesPlugin({ root: "/src/routes" }),
    vitePluginSsrMiddleware({
      entry: process.env["SERVER_ENTRY"] ?? "./src/server/adapter-node.ts",
    }),
    vitePluginSsrCss({
      entry: ["./src/client/index.tsx"],
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

function vitePluginSsrCss(pluginOpts: {
  entry: string[];
  depth?: number;
}): Plugin {
  let server: ViteDevServer;

  return {
    name: "local:" + vitePluginSsrCss.name,

    apply(_config, env) {
      return env.command === "serve";
    },

    configureServer(_server) {
      server = _server;
    },

    transformIndexHtml: {
      handler: async () => {
        const styleUrls = await collectSsrStyleUrls(server, pluginOpts.entry);

        const styleTags: HtmlTagDescriptor[] = styleUrls.map((href) => ({
          tag: "link",
          injectTo: "head",
          attrs: {
            [SSR_INLINE_CSS_ATTR]: true,
            rel: "stylesheet",
            href,
          },
        }));

        return [
          ...styleTags,
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

// style collection
// https://github.com/remix-run/remix/blob/1a8a5216106bd8c3073cc3e5e5399a32c981db74/packages/remix-dev/vite/styles.ts
// https://github.com/vikejs/vike/blob/f9a91f3c47cab9c2871526ef714cc0f87a41fda0/vike/node/runtime/renderPage/getPageAssets/retrieveAssetsDev.ts
async function collectSsrStyleUrls(
  server: ViteDevServer,
  entries: string[]
): Promise<string[]> {
  const visited = new Set<string>();

  async function traverse(url: string) {
    const [, id] = await server.moduleGraph.resolveUrl(url);
    if (visited.has(id)) return;

    visited.add(id);
    if (id.includes("/node_modules/")) return;

    const mod = server.moduleGraph.getModuleById(id);
    if (!mod) return;

    await Promise.all(
      [...mod.importedModules].map((childMod) => traverse(childMod.url))
    );
  }

  // ensure vite's import analysis is ready only for top entries
  await Promise.all(entries.map((e) => server.transformRequest(e)));

  // traverse
  await Promise.all(entries.map((url) => traverse(url)));

  // "?direct" trick from Vike
  // https://github.com/vikejs/vike/blob/f9a91f3c47cab9c2871526ef714cc0f87a41fda0/vike/node/runtime/renderPage/getPageAssets.ts#L83
  const result = [...visited]
    .filter((url) => url.match(CSS_LANGS_RE))
    .map((url) => `${url}?direct`);

  return result;
}

// cf. https://github.com/vitejs/vite/blob/d6bde8b03d433778aaed62afc2be0630c8131908/packages/vite/src/node/constants.ts#L49C23-L50
const CSS_LANGS_RE =
  /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;

const SSR_INLINE_CSS_ATTR = "data-vite-ssr-css";

// script to clear inlined css after first hot update
// since vite should take care css during dev
const SSR_INLINE_CSS_SCRIPT = /* js */ `

import { createHotContext } from "/@vite/client";

// instantiate import.meta.hot with dummy file
const hot = createHotContext("/__dummy__${vitePluginSsrCss.name}");

// https://vitejs.dev/guide/api-hmr.html#hot-on-event-cb
hot.on("vite:afterUpdate", clearCss);

function clearCss() {
  hot.off("vite:afterUpdate", clearCss);

  document.querySelectorAll("style[${SSR_INLINE_CSS_ATTR}]").forEach(node => {
    node.remove();
  });
}

`;
