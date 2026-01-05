import fs from "node:fs";
import path from "node:path";
import { tinyassert } from "@hiogawa/utils";
import type { Manifest, Plugin, ViteDevServer } from "vite";
import { $__global } from "../../global";
import type { PluginStateManager } from "../../plugin";
import { ENTRY_BROWSER_WRAPPER, createVirtualPlugin } from "../../plugin/utils";
import { collectStyleUrls, transformStyleUrls } from "./css";
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
    createVirtualPlugin("ssr-assets", async function () {
      // dev
      if (this.environment?.mode === "dev") {
        // extract <head> injected by plugins
        let { head } = await getIndexHtmlTransform($__global.dev.server);

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

      // build - use @vitejs/plugin-rsc assets manifest
      const manifest: Manifest = JSON.parse(
        await fs.promises.readFile(
          path.join(manager.outDir, "client", ".vite", "manifest.json"),
          "utf-8",
        ),
      );
      const entry = manifest[ENTRY_BROWSER_WRAPPER];
      tinyassert(entry);
      const css = entry.css ?? [];
      const head = [
        ...css.map((href) => `<link rel="stylesheet" href="/${href}" />`),
      ].join("\n");
      const result: SsrAssetsType = {
        bootstrapModules: [`/${entry.file}`],
        head,
      };
      return `export default ${JSON.stringify(result)}`;
    }),

    createVirtualPlugin(DEV_SSR_CSS.split(":")[1]!, async function () {
      tinyassert(this.environment?.mode === "dev");
      const serverStyleUrls = await collectStyleUrls(
        $__global.dev.server.environments["rsc"]!,
        {
          entries: [entryServer, "virtual:server-routes"],
        },
      );
      const clientStyleUrls = await collectStyleUrls(
        $__global.dev.server.environments.client,
        {
          entries: [entryBrowser, "virtual:client-routes"],
        },
      );
      const styles = await Promise.all([
        `/******* react-server ********/`,
        await transformStyleUrls(
          $__global.dev.server.environments.client,
          serverStyleUrls,
        ),
        `/******* client **************/`,
        await transformStyleUrls(
          $__global.dev.server.environments.client,
          clientStyleUrls,
        ),
      ]);
      return styles.join("\n\n");
    }),

    createVirtualPlugin(SERVER_CSS_PROXY.split(":")[1]!, async function () {
      // virtual module to proxy css imports from react server to client
      if (this.environment?.mode === "dev") {
        const urls = await collectStyleUrls(
          $__global.dev.server.environments["rsc"]!,
          {
            entries: [entryServer, "virtual:server-routes"],
          },
        );
        const code = urls.map((url) => `import "${url}";\n`).join("");
        // ensure hmr boundary since css module doesn't have `import.meta.hot.accept`
        return code + `if (import.meta.hot) { import.meta.hot.accept() }`;
      }
      // build
      return "export {}";
    }),
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
