import fs from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { tinyassert } from "@hiogawa/utils";
import type { Plugin } from "vite";
import type { PluginStateManager } from "../../plugin";
import { RSC_PATH } from "../server-component/utils";

export function prerenderPlugin({
  manager,
  prerender,
}: {
  manager: PluginStateManager;
  prerender?: () => Promise<string[]> | string[];
}): Plugin[] {
  return [
    {
      name: prerenderPlugin + ":build",
      enforce: "post",
      apply: () => !!(prerender && manager.buildType === "ssr"),
      async closeBundle() {
        console.log("▶▶▶ PRERENDER");
        tinyassert(prerender);
        const routes = await prerender();
        const entry: typeof import("../../entry/server") = await import(
          path.resolve("dist/server/__entry_ssr.js")
        );
        const entries = Array<{
          route: string;
          html: string;
          data: string;
        }>();
        for (const route of routes) {
          console.log(`  • ${route}`);
          const url = new URL(route, "https://prerender.local");
          const request = new Request(url);
          const { stream, html } = await entry.prerender(request);
          const data = Readable.from(stream as any);
          const htmlFile =
            route + (route.endsWith("/") ? "index.html" : ".html");
          const dataFile = route + RSC_PATH;
          await mkdir(path.dirname(path.join("dist/client", htmlFile)), {
            recursive: true,
          });
          await writeFile(path.join("dist/client", htmlFile), html);
          await writeFile(path.join("dist/client", dataFile), data);
          entries.push({
            route,
            html: htmlFile,
            data: dataFile,
          });
        }
        await writeFile(
          "dist/client/__prerender.json",
          JSON.stringify(entries, null, 2),
        );
      },
    },
    {
      name: prerenderPlugin + ":preview",
      apply: (_config, env) => !!(prerender && env.isPreview),
      configurePreviewServer(server) {
        const outDir = server.config.build.outDir;
        server.middlewares.use((req, _res, next) => {
          // rewrite `/abc` to `/abc.html` since Vite "mpa" mode doesn't support this
          const url = new URL(req.url!, "https://test.local");
          if (fs.existsSync(path.join(outDir, url.pathname + ".html"))) {
            req.url = path.posix.join(url.pathname + ".html");
          }
          next();
        });
      },
    },
  ];
}
