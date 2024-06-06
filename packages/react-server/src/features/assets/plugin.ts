import fs from "node:fs";
import { tinyassert, typedBoolean } from "@hiogawa/utils";
import {
  type Manifest,
  type Plugin,
  type ViteDevServer,
  isCSSRequest,
} from "vite";
import { $__global } from "../../lib/global";
import type { PluginStateManager } from "../../plugin";
import {
  ENTRY_CLIENT,
  ENTRY_CLIENT_WRAPPER,
  ENTRY_REACT_SERVER,
  createVirtualPlugin,
} from "../../plugin/utils";
import { collectStyle, collectStyleUrls } from "./css";

export interface SsrAssetsType {
  bootstrapModules: string[];
  head: string;
}

export const SERVER_CSS_PROXY = "virtual:server-css-proxy.js";

export function serverAssetsPluginClient({
  manager,
}: { manager: PluginStateManager }): Plugin[] {
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
            href="/@id/__x00__virtual:dev-ssr-css.css?direct"
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
          bootstrapModules: [`/@id/__x00__${ENTRY_CLIENT_WRAPPER}`],
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
        const entry = manifest[ENTRY_CLIENT_WRAPPER];
        tinyassert(entry);
        const css = entry.css ?? [];
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

    createVirtualPlugin("dev-ssr-css.css", async () => {
      tinyassert(!manager.buildType);
      const styles = await Promise.all([
        `/******* react-server ********/`,
        collectStyle($__global.dev.reactServer, [ENTRY_REACT_SERVER]),
        `/******* client **************/`,
        collectStyle($__global.dev.server, [
          ENTRY_CLIENT,
          // TODO: dev should also use RouteManifest to manage client css
          ...manager.rscUseClientIds,
        ]),
      ]);
      return styles.join("\n\n");
    }),

    createVirtualPlugin(SERVER_CSS_PROXY.slice("virtual:".length), async () => {
      // virtual module to proxy css imports from react server to client
      // TODO: invalidate + full reload when add/remove css file?
      if (!manager.buildType) {
        const urls = await collectStyleUrls($__global.dev.reactServer, [
          ENTRY_REACT_SERVER,
        ]);
        const code = urls.map((url) => `import "${url}";\n`).join("");
        // ensure hmr boundary since css module doesn't have `import.meta.hot.accept`
        return code + `if (import.meta.hot) { import.meta.hot.accept() }`;
      }
      if (manager.buildType === "client") {
        // shaky way to keep css module import side effect
        const code = manager.serverCssIds
          .map((url) => `export * from "${url}";\n`)
          .join("");
        return { code, map: null, moduleSideEffects: "no-treeshake" };
      }
      tinyassert(false);
    }),
  ];
}

export function serverAssertsPluginServer({
  manager,
}: { manager: PluginStateManager }): Plugin[] {
  // TODO
  // - css should be processed on server plugin? (currently only id is passed over to client)
  // - css code split by route?
  // - css ordering?
  return [
    {
      name: serverAssertsPluginServer.name + ":build",
      apply: "build",
      buildEnd() {
        if (manager.buildType === "rsc") {
          manager.serverCssIds = [...this.getModuleIds()].filter((id) =>
            isCSSRequest(id),
          );
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
