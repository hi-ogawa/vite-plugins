import fs from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { tinyassert } from "@hiogawa/utils";
import type { Plugin } from "vite";
import type { PluginStateManager } from "../../plugin";
import type { RouteModuleManifest } from "../router/server";
import { RSC_PATH } from "../server-component/utils";

type MaybePromise<T> = Promise<T> | T;

export type PrerenderFn = (
  manifest: RouteModuleManifest,
  presets: ReturnType<typeof createPrerenderPresets>,
) => MaybePromise<string[]>;

export function prerenderPlugin({
  manager,
  prerender,
}: {
  manager: PluginStateManager;
  prerender: PrerenderFn;
}): Plugin[] {
  return [
    {
      name: prerenderPlugin + ":build",
      enforce: "post",
      apply: () => manager.buildType === "ssr",
      // TODO: use writeBundle sequential
      async closeBundle() {
        console.log("▶▶▶ PRERENDER");
        tinyassert(prerender);
        const entry: typeof import("../../entry/server") = await import(
          path.resolve("dist/server/__entry_ssr.js")
        );
        const { router } = await entry.importReactServer();
        const presets = createPrerenderPresets(router.manifest);
        const routes = await prerender(router.manifest, presets);
        const entries = Array<{
          route: string;
          html: string;
          data: string;
        }>();
        for (const route of routes) {
          console.log(`  • ${route}`);
          const url = new URL(route, "https://prerender.local");
          const request = new Request(url, {
            headers: {
              "x-react-server-render-mode": "prerender",
            },
          });
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
      apply: (_config, env) => !!env.isPreview,
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

function createPrerenderPresets(manifest: RouteModuleManifest) {
  const entries = manifest.entries;

  return {
    static: async () => {
      const result: string[] = [];
      for (const entry of entries) {
        const page = entry.module?.page;
        if (page && !entry.dynamic) {
          result.push(entry.pathname);
        }
      }
      return result;
    },

    generateStaticParams: async () => {
      const result: string[] = [];
      for (const entry of entries) {
        const page = entry.module?.page;
        if (page && entry.dynamic && page.generateStaticParams) {
          const generated = await page.generateStaticParams();
          for (const params of generated) {
            result.push(entry.format(params));
          }
        }
      }
      return result;
    },
  };
}
