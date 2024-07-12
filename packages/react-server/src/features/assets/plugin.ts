import fs from "node:fs";
import path from "node:path";
import { tinyassert, typedBoolean } from "@hiogawa/utils";
import type { Manifest, Plugin, ViteDevServer } from "vite";
import { $__global } from "../../global";
import type { PluginStateManager } from "../../plugin";
import { ENTRY_BROWSER_WRAPPER, createVirtualPlugin } from "../../plugin/utils";
import { collectStyle, collectStyleUrls } from "./css";
import { DEV_SSR_CSS, SERVER_CSS_PROXY } from "./shared";

export interface SsrAssetsType {
  bootstrapModules: string[];
  head: string;
}

export function vitePluginServerAssets({
  manager,
  entryBrowser,
  entryServer,
}: {
  manager: PluginStateManager;
  entryBrowser: string;
  entryServer: string;
}): Plugin[] {
  return [
    createVirtualPlugin("ssr-assets", async () => {
      // dev
      if (!manager.buildType) {
        // extract <head> injected by plugins
        let { head } = await getIndexHtmlTransform($__global.dev.server);

        // expose raw dynamic `import` which doesn't go through vite's transform
        // since it would inject `<id>?import` and cause dual packages when
        // client code is both imported at the boundary (as `<id>?import`)
        // and not at the boundary (as `<id>`).
        head += `<script>globalThis.__raw_import = (id) => import(id)</script>\n`;

        // serve dev css as ?direct so that ssr html won't get too huge.
        // then remove this injected style on first hot update.
        head += `\
          <link
            data-ssr-dev-css
            rel="stylesheet"
            href="/@id/__x00__${DEV_SSR_CSS}?direct"
          />
          <script type="module">
            import { createHotContext } from "/@vite/client";
            const hot = createHotContext("hot-data-ssr-dev-css");
            hot.on("vite:afterUpdate", () => {
              document
                .querySelectorAll("[data-ssr-dev-css]")
                .forEach(node => node.remove());
            });
          </script>
        `;
        const result: SsrAssetsType = {
          bootstrapModules: [`/@id/__x00__${ENTRY_BROWSER_WRAPPER}`],
          head,
        };
        return `export default ${JSON.stringify(result)}`;
      }

      // build
      if (manager.buildType === "ssr") {
        // TODO: (refactor) use RouteManifest?
        const manifest: Manifest = JSON.parse(
          await fs.promises.readFile(
            "dist/client/.vite/manifest.json",
            "utf-8",
          ),
        );
        const entry = manifest[ENTRY_BROWSER_WRAPPER];
        tinyassert(entry);
        const css = [
          ...(entry.css ?? []),
          ...manager.serverAssets.filter((file) => file.endsWith(".css")),
        ];
        const js =
          entry.dynamicImports
            ?.map((k) => manifest[k]?.file)
            .filter(typedBoolean) ?? [];
        const head = [
          ...css.map((href) => `<link rel="stylesheet" href="/${href}" />`),
          ...js.map((href) => `<link rel="modulepreload" href="/${href}" />`),
        ].join("\n");
        const result: SsrAssetsType = {
          bootstrapModules: [`/${entry.file}`],
          head,
        };
        return `export default ${JSON.stringify(result)}`;
      }

      tinyassert(false);
    }),

    createVirtualPlugin(DEV_SSR_CSS.split(":")[1]!, async () => {
      tinyassert(!manager.buildType);
      const styles = await Promise.all([
        `/******* react-server ********/`,
        collectStyle($__global.dev.reactServer, {
          entries: [entryServer, "virtual:server-routes"],
          ssr: true,
        }),
        `/******* client **************/`,
        collectStyle($__global.dev.server, {
          entries: [
            entryBrowser,
            // TODO: dev should also use RouteManifest to manage client css
            ...manager.clientReferenceMap.keys(),
          ],
          ssr: false,
        }),
      ]);
      return styles.join("\n\n");
    }),

    createVirtualPlugin(SERVER_CSS_PROXY.split(":")[1]!, async () => {
      // virtual module to proxy css imports from react server to client
      // TODO: invalidate + full reload when add/remove css file?
      if (!manager.buildType) {
        const urls = await collectStyleUrls($__global.dev.reactServer, {
          entries: [entryServer, "virtual:server-routes"],
          ssr: true,
        });
        const code = urls.map((url) => `import "${url}";\n`).join("");
        // ensure hmr boundary since css module doesn't have `import.meta.hot.accept`
        return code + `if (import.meta.hot) { import.meta.hot.accept() }`;
      }
      if (manager.buildType === "browser") {
        return "export {}";
      }
      tinyassert(false);
    }),

    {
      name: vitePluginServerAssets.name + ":copy-build",
      async writeBundle() {
        if (manager.buildType === "browser") {
          for (const file of manager.serverAssets) {
            await fs.promises.cp(
              path.join("dist/rsc", file),
              path.join("dist/client", file),
            );
          }
        }
      },
    },
  ];
}

export function serverAssertsPluginServer({
  manager,
}: { manager: PluginStateManager }): Plugin[] {
  // 0. track server assets during server build (this plugin)
  // 1. copy all server assets to browser build (copy-build plugin)
  // 2. out of those, inject links automatically (ssr-assets virtual plugin)
  //    - .css => stylesheet
  //    - .woff => font preload

  // TODO
  // - css ordering?
  // - css code split by route?

  return [
    {
      name: serverAssertsPluginServer.name + ":build",
      apply: "build",
      generateBundle(_options, bundle) {
        if (manager.buildType !== "server") {
          return;
        }
        for (const [_k, v] of Object.entries(bundle)) {
          if (v.type === "asset") {
            manager.serverAssets.push(v.fileName);
          }
        }
      },
    },
  ];
}

async function getIndexHtmlTransform(server: ViteDevServer) {
  const html = await server.transformIndexHtml(
    "/",
    "<html><head></head></html>",
  );
  const match = html.match(/<head>(.*)<\/head>/s);
  tinyassert(match && 1 in match);
  const head = match[1];
  return { head };
}
