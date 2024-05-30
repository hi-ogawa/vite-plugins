import type { Plugin, ViteDevServer } from "vite";
import { name as packageName } from "../package.json";
import { collectStyle } from "./collect";

const VIRTUAL_ENTRY = "virtual:ssr-css.css";

export function vitePluginSsrCss(pluginOpts: { entries: string[] }): Plugin {
  let server: ViteDevServer;

  // TODO: base
  const virtualHref = "/@id/__x00__" + VIRTUAL_ENTRY;

  return {
    name: packageName,
    apply: "serve",
    configureServer(server_) {
      server = server_;

      // invalidate virtual modules for each direct request
      server.middlewares.use((req, _res, next) => {
        if (req.url === virtualHref) {
          invalidateModule(server, "\0" + VIRTUAL_ENTRY + "?direct");
        }
        next();
      });
    },

    // virtual module
    // (use `startsWith` since Vite adds `?direct` for raw css request)
    resolveId(source, _importer, _options) {
      return source.startsWith(VIRTUAL_ENTRY) ? "\0" + source : undefined;
    },
    async load(id, _options) {
      if (id.startsWith("\0" + VIRTUAL_ENTRY)) {
        const url = new URL(id.slice(1), "https://test.local");
        let code = await collectStyle(server, pluginOpts.entries);
        if (!url.searchParams.has("direct")) {
          code = `export default ${JSON.stringify(code)}`;
        }
        return code;
      }
      return;
    },

    // also expose via transformIndexHtml
    transformIndexHtml: {
      handler: async () => {
        return [
          {
            tag: "link",
            injectTo: "head",
            attrs: {
              rel: "stylesheet",
              href: virtualHref,
              "data-ssr-css": true,
            },
          },
          {
            tag: "script",
            injectTo: "head",
            attrs: { type: "module" },
            children: /* js */ `
              import { createHotContext } from "/@vite/client";
              const hot = createHotContext("/__clear_ssr_css");
              hot.on("vite:afterUpdate", () => {
                document
                  .querySelectorAll("[data-ssr-css]")
                  .forEach(node => node.remove());
              });
            `,
          },
        ];
      },
    },
  };
}

function invalidateModule(server: ViteDevServer, id: string) {
  const mod = server.moduleGraph.getModuleById(id);
  if (mod) {
    server.moduleGraph.invalidateModule(mod);
  }
}
