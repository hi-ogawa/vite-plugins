import fs from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { tinyassert } from "@hiogawa/utils";
import type { Plugin } from "vite";
import type { PluginStateManager } from "../../plugin";
import { createVirtualPlugin } from "../../plugin/utils";
import type { RouteModuleManifest } from "../router/server";
import { RSC_PATH } from "../server-component/utils";
import type { PPRManifest } from "./utils";

type MaybePromise<T> = Promise<T> | T;

export type PrerenderFn = (
  manifest: RouteModuleManifest,
  presets: ReturnType<typeof createPrerenderPresets>,
) => MaybePromise<string[]>;

export type PrerenderManifest = {
  entries: PrerenderEntry[];
};

type PrerenderEntry = {
  route: string;
  html: string;
  data: string;
};

export function prerenderPlugin(options: {
  manager: PluginStateManager;
  prerender?: PrerenderFn;
}): Plugin[] {
  return [
    {
      name: prerenderPlugin + ":build",
      enforce: "post",
      apply: () => !!options.prerender && options.manager.buildType === "ssr",
      config: () => {
        return {
          build: {
            rollupOptions: {
              input: {
                __entry_ssr: "@hiogawa/react-server/entry/ssr",
              },
            },
          },
        };
      },
      writeBundle: {
        sequential: true,
        handler() {
          tinyassert(options.prerender);
          return processPrerender(options.prerender);
        },
      },
    },
    {
      name: prerenderPlugin + ":preview",
      apply: (_config, env) => !!options.prerender && !!env.isPreview,
      configurePreviewServer(server) {
        const outDir = server.config.build.outDir;
        server.middlewares.use((req, _res, next) => {
          // rewrite `/abc` to `/abc.html` since Vite "mpa" mode doesn't support this
          const url = new URL(req.url!, "https://test.local");
          const htmlFile = urlPathToHtmlPath(url.pathname);
          if (fs.existsSync(path.join(outDir, htmlFile))) {
            req.url = htmlFile;
          }
          next();
        });
      },
    },
  ];
}

function urlPathToHtmlPath(pathname: string) {
  return pathname + (pathname.endsWith("/") ? "index.html" : ".html");
}

async function processPrerender(getPrerenderRoutes: PrerenderFn) {
  console.log("▶▶▶ PRERENDER");
  const entry: typeof import("../../entry/ssr") = await import(
    path.resolve("dist/server/__entry_ssr.js")
  );
  const { router } = await entry.importReactServer();
  const presets = createPrerenderPresets(router.manifest);
  const routes = await getPrerenderRoutes(router.manifest, presets);
  const manifest: PrerenderManifest = { entries: [] };
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
    const htmlFile = urlPathToHtmlPath(route);
    const dataFile = route + RSC_PATH;
    await mkdir(path.dirname(path.join("dist/client", htmlFile)), {
      recursive: true,
    });
    await writeFile(path.join("dist/client", htmlFile), html);
    await writeFile(path.join("dist/client", dataFile), data);
    manifest.entries.push({
      route,
      html: htmlFile,
      data: dataFile,
    });
  }
  await writeFile(
    "dist/client/__prerender.json",
    JSON.stringify(manifest, null, 2),
  );
}

function createPrerenderPresets(manifest: RouteModuleManifest) {
  const entries = manifest.entries;

  return {
    static: async () => {
      const result: string[] = [];
      for (const entry of entries) {
        const page = entry.module?.page;
        if (page && !entry.dynamic) {
          result.push(entry.format({}));
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

export type PPRFn = () => MaybePromise<string[]>;

export function pprPlugin(options: {
  manager: PluginStateManager;
  ppr?: PPRFn;
}): Plugin[] {
  return [
    {
      name: pprPlugin.name + ":build",
      enforce: "post",
      apply: () => !!options.ppr && options.manager.buildType === "ssr",
      config: () => {
        return {
          build: {
            rollupOptions: {
              input: {
                __entry_ssr: "@hiogawa/react-server/entry/ssr",
                __ppr_manifest: "virtual:ppr-manifest",
              },
            },
          },
        };
      },
      writeBundle: {
        sequential: true,
        handler: async () => {
          tinyassert(options.ppr);
          await processPPR(options.ppr);
        },
      },
    },
    createVirtualPlugin("ppr-manifest", () => {
      return `export default undefined`;
    }),
  ];
}

async function processPPR(getPPRRoutes: PPRFn) {
  console.log("▶▶▶ PARTIAL PRERENDER");
  const routes = await getPPRRoutes();
  const entry: typeof import("../../entry/ssr") = await import(
    path.resolve("dist/server/__entry_ssr.js")
  );
  const manifest: PPRManifest = { entries: {} };
  for (const route of routes) {
    console.log(`  • ${route}`);
    const url = new URL(route, "https://prerender.local");
    const request = new Request(url, {
      headers: {
        "x-react-server-render-mode": "ppr",
      },
    });
    const data = await entry.partialPrerender(request);
    manifest.entries[route] = data;
  }
  writeFile(
    "dist/server/__ppr_manifest.js",
    `export default ${JSON.stringify(manifest, null, 2)}\n`,
  );
}
