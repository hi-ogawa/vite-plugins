import process from "node:process";
import globRoutesPlugin from "@hiogawa/vite-glob-routes";
import { importDevServerPlugin } from "@hiogawa/vite-import-dev-server";
import { viteNullExportPlugin } from "@hiogawa/vite-null-export";
import { vitePluginSsrMiddleware } from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import {
  FilterPattern,
  type Plugin,
  ResolvedConfig,
  ViteDevServer,
  createFilter,
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
    vitePluginSsrInlineCss({
      input: "virtual:uno.css",
      // entry: "virtual:uno.css",
      debug: true,
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
// https://github.com/remix-run/remix/blob/1a8a5216106bd8c3073cc3e5e5399a32c981db74/packages/remix-dev/vite/styles.ts
// https://github.com/vikejs/vike/blob/f9a91f3c47cab9c2871526ef714cc0f87a41fda0/vike/node/runtime/renderPage/getPageAssets/retrieveAssetsDev.ts#L7
function vitePluginSsrInlineCss(pluginOpts: {
  // entry: string;
  input: string;
  include?: FilterPattern;
  exclude?: FilterPattern;
  // includeForce?: "",
  // forceEntry?: string[];
  debug?: boolean;
}): Plugin {
  let server: ViteDevServer;
  const map = new Map<string, string>();
  const filter = createFilter(
    pluginOpts.include ?? CSS_LANGS_RE,
    pluginOpts.exclude
  );

  let logger!: ResolvedConfig["logger"];

  return {
    name: "local:" + vitePluginSsrInlineCss.name,

    apply(_config, env) {
      return env.command === "serve";
    },

    configResolved(config) {
      logger = config.logger;
    },

    configureServer(_server) {
      server = _server;
      server.transformRequest;
      if (pluginOpts.input) {
      }
      // server.moduleGraph.resolveUrl()
    },

    transform(code, id, options) {
      // if (options?.ssr) {
      // }
      // console.log(filter(id), id);
      // console.log(id)
      // if (id.match(CSS_LANGS_RE)) {
      //   // console.log(id, filter(id));
      //   console.log({ id, code });
      // }
      if (filter(id)) {
        // accumulate all matching code which is expected to be plain css
        map.set(id, code);
      }
      // if (options?.ssr && filter(id)) {
      //   // accumulate all matching code which is expected to be plain css
      //   map.set(id, code);
      // }
    },

    transformIndexHtml: {
      handler: async () => {
        // const mod = await server.moduleGraph.getModuleByUrl("virtual:uno.css");
        // if (mod) {
        //   // mod?.importers
        //   mod.url
        // }
        // const [, resolvedId] = await server.moduleGraph.resolveUrl("virtual:uno.css");
        // `${resolvedId}?direct`
        // resolvedId
        console.log(await server.moduleGraph.resolveUrl("virtual:uno.css"));
        if (pluginOpts.debug) {
          logger.info(
            `[DEBUG:${vitePluginSsrInlineCss.name}] ` +
              [...map.keys()].join(" ")
          );
        }
        pluginOpts.input;
        const css = [...map.entries()]
          .flatMap(([id, code]) => [`/*** ${id} ***/`, code])
          .join("\n\n");

        // resolveUrl + "?direct"
        // https://github.com/vikejs/vike/blob/f9a91f3c47cab9c2871526ef714cc0f87a41fda0/vike/node/runtime/renderPage/getPageAssets/retrieveAssetsDev.ts#L7
        // https://github.com/vikejs/vike/blob/f9a91f3c47cab9c2871526ef714cc0f87a41fda0/vike/node/runtime/renderPage/getPageAssets.ts#L83
        const [, resolvedId] = await server.moduleGraph.resolveUrl(
          pluginOpts.input
        );
        const styleHref = `${resolvedId}?direct`;

        return [
          {
            tag: "link",
            injectTo: "head",
            attrs: {
              [SSR_INLINE_CSS_ATTR]: true,
              rel: "stylesheet",
              href: styleHref,
            },
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

// cf. https://github.com/vitejs/vite/blob/7fd7c6cebfcad34ae7021ebee28f97b1f28ef3f3/packages/vite/src/node/constants.ts#L50-L51
const CSS_LANGS_RE = /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)$/;

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

  document.querySelectorAll("style[${SSR_INLINE_CSS_ATTR}]").forEach(node => {
    node.remove();
  });
}

`;
