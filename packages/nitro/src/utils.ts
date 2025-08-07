import fsp from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  type $Fetch,
  type Nitro,
  type NitroConfig,
  build,
  copyPublicAssets,
  createNitro,
  prepare,
} from "nitropack";
import type { PresetName } from "nitropack/presets";
import { joinURL, withBase, withoutBase } from "ufo";

// Using Nitro as post-build to target deployment platform. Inspired by Tanstack Start's approach.
// https://github.com/TanStack/router/blob/5fd079e482b1252b8b11a936f1524a0dee368cae/packages/start-plugin-core/src/nitro-plugin/plugin.ts

// The goal is to replace framework's hand-written post-build scripts, such as
// https://github.com/hi-ogawa/waku/blob/084c71a6d2450b4a69146e97b0005d59ee9394cd/packages/waku/src/vite-rsc/deploy/vercel/plugin.ts

export type BuildAppOptions = {
  preset?: PresetName;
  publicDir?: string;
  renderer: string;
  prerender?: string[];
};

export async function buildApp(
  nitroPluginOptions: BuildAppOptions,
): Promise<void> {
  const nitroConfig: NitroConfig = {
    // ===
    // === essential features
    // ===
    preset: nitroPluginOptions.preset,
    publicAssets: nitroPluginOptions.publicDir
      ? [
          {
            dir: nitroPluginOptions.publicDir,
            baseURL: "/",
            maxAge: 31536000, // 1 year
          },
        ]
      : undefined,
    renderer: "virtual:renderer-entry",
    rollupConfig: {
      plugins: [
        {
          name: "virtual-server-entry",
          resolveId(source) {
            if (source === "virtual:renderer-entry") {
              return "\0" + source;
            }
            if (source === "virtual:renderer-entry-inner") {
              return this.resolve(nitroPluginOptions.renderer);
            }
          },
          load(id) {
            if (id === "\0virtual:renderer-entry") {
              return `\
import handler from 'virtual:renderer-entry-inner';
import { defineEventHandler, toWebRequest } from "h3"
export default defineEventHandler((event) => handler(toWebRequest(event)))
`;
            }
          },
        },
        // TODO: preserve server source maps?
        // virtualBundlePlugin(getSsrBundle()),
      ],
    },

    // ===
    // === basic settings
    // ===
    // buildDir: 'dist/nitro/build',
    // output: { dir: 'dist/nitro/output' },

    // ===
    // === disable other features
    // ===
    dev: false,
    // TODO: do we need this? should this be made configurable?
    compatibilityDate: "2024-11-19",
    // logLevel: 3,
    // baseURL: globalThis.TSS_APP_BASE,
    // TODO: how to avoid .nitro/types?
    typescript: {
      generateRuntimeConfigTypes: false,
      generateTsConfig: false,
    },
    prerender: undefined,
    plugins: [], // Nitro's plugins
    appConfigFiles: [],
    scanDirs: [],
    imports: false, // unjs/unimport for global/magic imports
    virtual: {
      // This is Nitro's way of defining virtual modules
      // Should we define the ones for TanStack Start's here as well?
    },
  };

  const nitro = await createNitro(nitroConfig);
  await prepare(nitro);
  await copyPublicAssets(nitro);
  if (nitroPluginOptions.prerender?.length) {
    await prerender(nitro, nitroPluginOptions.prerender);
  }
  await build(nitro);
  await nitro.close();
}

// In Waku's case, it currently has own prerender pass, so this is not necessary.
// https://github.com/TanStack/router/blob/5fd079e482b1252b8b11a936f1524a0dee368cae/packages/start-plugin-core/src/nitro-plugin/prerender.ts#L53
// https://github.com/nitrojs/nitro/blob/c468de271cff8d56361c3b09ea1071ed545a550f/src/prerender/prerender.ts#L62-L74
async function prerender(nitro: Nitro, pages: string[]) {
  const nodeNitro = await createNitro({
    ...nitro.options._config,
    preset: "nitro-prerender",
    // logLevel: 0,
    output: {
      // dir: 'dist/nitro/prerender',
      // serverDir: path.resolve(prerenderOutputDir, 'server'),
      // publicDir: path.resolve(prerenderOutputDir, 'public'),
    },
  });
  await build(nodeNitro);

  const serverEntrypoint = pathToFileURL(
    path.resolve(nodeNitro.options.output.serverDir, "index.mjs"),
  ).toString();

  const { closePrerenderer, localFetch } = (await import(serverEntrypoint)) as {
    closePrerenderer: () => void;
    localFetch: $Fetch;
  };

  for (const page of pages) {
    await prerenderPage({ path: page });
  }
  closePrerenderer();
  await nodeNitro.close();

  async function prerenderPage(page: { path: string }) {
    // const encodedRoute = encodeURI(page.path)
    const encodedRoute = page.path;

    const res = await localFetch<Response>(
      withBase(encodedRoute, nodeNitro.options.baseURL),
      {
        headers: { "x-nitro-prerender": encodedRoute },
      },
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch ${page.path}: ${res.statusText}`, {
        cause: res,
      });
    }

    // const cleanPagePath = (prerenderOptions.outputPath || page.path).split(
    //   /[?#]/,
    // )[0]!
    const cleanPagePath =
      page.path // prerenderOptions.outputPath ||
        .split(/[?#]/)[0]!;
    // const cleanPagePath = page.path

    // Guess route type and populate fileName
    const contentType = res.headers.get("content-type") || "";
    const isImplicitHTML =
      !cleanPagePath.endsWith(".html") && contentType.includes("html");
    // &&
    // !JsonSigRx.test(dataBuff.subarray(0, 32).toString('utf8'))
    const routeWithIndex = cleanPagePath.endsWith("/")
      ? cleanPagePath + "index"
      : cleanPagePath;

    const htmlPath = cleanPagePath.endsWith("/")
      ? // || prerenderOptions.autoSubfolderIndex
        joinURL(cleanPagePath, "index.html")
      : cleanPagePath + ".html";

    const filename = withoutBase(
      isImplicitHTML ? htmlPath : routeWithIndex,
      nitro.options.baseURL,
    );

    const html = await res.text();

    const filepath = path.join(nitro.options.output.publicDir, filename);

    await fsp.mkdir(path.dirname(filepath), {
      recursive: true,
    });

    await fsp.writeFile(filepath, html);

    // need to update internal state e.g. for vercel route `overrides`
    // https://github.com/nitrojs/nitro/blob/c468de271cff8d56361c3b09ea1071ed545a550f/src/presets/vercel/utils.ts#L117
    nitro._prerenderedRoutes ??= [];
    nitro._prerenderedRoutes.push({
      route: page.path,
      fileName: filename,
    });
  }
}
