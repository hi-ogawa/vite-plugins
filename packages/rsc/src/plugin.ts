import assert from "node:assert";
import { createHash } from "node:crypto";
import path from "node:path";
import {
  transformDirectiveProxyExport,
  transformServerActionServer,
} from "@hiogawa/transforms";
import { createRequestListener } from "@mjackson/node-fetch-server";
import {
  type EnvironmentModuleNode,
  type Plugin,
  type ResolvedConfig,
  Rollup,
  RunnableDevEnvironment,
  type ViteDevServer,
  defaultServerConditions,
  isCSSRequest,
  parseAstAsync,
} from "vite";
import type { ModuleRunner } from "vite/module-runner";
import { crawlFrameworkPkgs } from "vitefu";
import vitePluginRscCore from "./core/plugin";
import { normalizeViteImportAnalysisUrl } from "./vite-utils";

// state for build orchestration
let clientReferences: Record<string, string> = {};
let serverReferences: Record<string, string> = {};
let buildScan = false;
let server: ViteDevServer;
let config: ResolvedConfig;
let viteSsrRunner: ModuleRunner;
let viteRscRunner: ModuleRunner;

const PKG_NAME = "@hiogawa/vite-rsc";

export default function vitePluginRsc({
  entries,
  clientPackages,
}: {
  entries: {
    browser: string;
    rsc: string;
    ssr: string;
    css?: string;
  };
  // TODO: this can be heuristically cralwed from package.json.
  // TODO: in principle, same trick is needed for `"use server"` package imported directly from client component.
  clientPackages?: string[];
}): Plugin[] {
  return [
    {
      name: "rsc",
      config() {
        return {
          appType: "custom",
          environments: {
            client: {
              build: {
                manifest: true,
                outDir: "dist/client",
                rollupOptions: {
                  input: { index: "virtual:vite-rsc/browser-entry" },
                },
              },
              optimizeDeps: {
                include: [
                  "react-dom/client",
                  "react-server-dom-webpack/client.browser",
                ],
                exclude: [PKG_NAME],
              },
            },
            ssr: {
              build: {
                outDir: "dist/ssr",
                rollupOptions: {
                  input: { index: entries.ssr },
                },
              },
              resolve: {
                noExternal: [PKG_NAME],
              },
              optimizeDeps: {
                exclude: [PKG_NAME],
              },
            },
            rsc: {
              // `configEnvironment` below adds more `noExternal`
              resolve: {
                conditions: ["react-server", ...defaultServerConditions],
                noExternal: [
                  "react",
                  "react-dom",
                  "react-server-dom-webpack",
                  PKG_NAME,
                ],
              },
              optimizeDeps: {
                include: [
                  "react",
                  "react/jsx-runtime",
                  "react/jsx-dev-runtime",
                  "react-server-dom-webpack/server.edge",
                ],
                exclude: [PKG_NAME],
              },
              build: {
                outDir: "dist/rsc",
                rollupOptions: {
                  input: { index: entries.rsc },
                },
              },
            },
          },
          builder: {
            sharedPlugins: true,
            async buildApp(builder) {
              buildScan = true;
              builder.environments.rsc!.config.build.write = false;
              await builder.build(builder.environments.rsc!);
              builder.environments.rsc!.config.build.write = true;
              buildScan = false;
              await builder.build(builder.environments.rsc!);
              await builder.build(builder.environments.client!);
              await builder.build(builder.environments.ssr!);
            },
          },
        };
      },
      async configEnvironment(name, _config, env) {
        if (name !== "rsc") return;

        // bundle deps with react-server condition

        // crawl packages with "react" or "next" in "peerDependencies"
        // see https://github.com/svitejs/vitefu/blob/d8d82fa121e3b2215ba437107093c77bde51b63b/src/index.js#L95-L101
        const result = await crawlFrameworkPkgs({
          root: process.cwd(),
          isBuild: env.command === "build",
          isFrameworkPkgByJson(pkgJson) {
            const deps = pkgJson["peerDependencies"];
            return deps && "react" in deps;
          },
        });

        return {
          resolve: {
            noExternal: result.ssr.noExternal.sort(),
          },
        };
      },
      configResolved(config_) {
        config = config_;
      },
      configureServer(server_) {
        server = server_;
        viteSsrRunner = (server.environments.ssr as RunnableDevEnvironment)
          .runner;
        viteRscRunner = (server.environments.rsc as RunnableDevEnvironment)
          .runner;
        (globalThis as any).__viteSsrRunner = viteSsrRunner;
        (globalThis as any).__viteRscRunner = viteRscRunner;

        return () => {
          server.middlewares.use(async (req, res, next) => {
            try {
              const mod = await viteRscRunner.import(entries.rsc);
              createRequestListener(mod.default)(req, res);
            } catch (e) {
              next(e);
            }
          });
        };
      },
      async configurePreviewServer(server) {
        const mod = await import(
          /* @vite-ignore */ path.resolve(`dist/rsc/index.js`)
        );
        const handler = createRequestListener(mod.default);

        // disable compressions since it breaks html streaming
        // https://github.com/vitejs/vite/blob/9f5c59f07aefb1756a37bcb1c0aff24d54288950/packages/vite/src/node/preview.ts#L178
        server.middlewares.use((req, _res, next) => {
          delete req.headers["accept-encoding"];
          next();
        });

        return () => {
          server.middlewares.use(async (req, res, next) => {
            try {
              handler(req, res);
            } catch (e) {
              next(e);
            }
          });
        };
      },
      async hotUpdate(ctx) {
        const ids = ctx.modules.map((mod) => mod.id).filter((v) => v !== null);
        if (ids.length === 0) return;

        const cliendIds = new Set(Object.values(clientReferences));
        const isClientReference = ids.some((id) => cliendIds.has(id));
        if (!isClientReference) {
          if (this.environment.name === "rsc") {
            // server hmr
            ctx.server.environments.client.hot.send({
              type: "custom",
              event: "rsc:update",
              data: {
                file: ctx.file,
              },
            });
          }

          if (this.environment.name === "client") {
            // Server files can be included in client module graph, for example,
            // when `addWatchFile` is used to track js files as style dependency (e.g. tailwind)
            // In this case, reload all importers (for css hmr), and return empty modules to avoid full-reload.
            const env = ctx.server.environments.rsc!;
            const mod = env.moduleGraph.getModuleById(ctx.file);
            if (mod) {
              for (const clientMod of ctx.modules) {
                for (const importer of clientMod.importers) {
                  if (importer.id && isCSSRequest(importer.id)) {
                    await this.environment.reloadModule(importer);
                  }
                }
              }
              return [];
            }
          }
        }
      },
    },
    {
      name: "rsc:patch-browser-raw-import",
      transform: {
        order: "post",
        handler(code) {
          if (code.includes("__vite_rsc_raw_import__")) {
            // inject dynamic import last to avoid Vite adding `?import` query to client references
            return code.replace("__vite_rsc_raw_import__", "import");
          }
        },
      },
    },
    {
      // externalize `dist/rsc/...` import as relative path in ssr build (and vice versa)
      name: "rsc:virtual:vite-rsc/import-entry",
      resolveId(source) {
        if (
          source === "virtual:vite-rsc/import-rsc" ||
          source === "virtual:vite-rsc/import-ssr"
        ) {
          return {
            id: `\0` + source,
            external: this.environment.mode === "build",
          };
        }
      },
      load(id) {
        if (id === "\0virtual:vite-rsc/import-rsc") {
          return `export default () => __viteRscRunner.import(${JSON.stringify(entries.rsc)})`;
        }
        if (id === "\0virtual:vite-rsc/import-ssr") {
          return `export default () => __viteSsrRunner.import(${JSON.stringify(entries.ssr)})`;
        }
      },
      renderChunk(code, chunk) {
        if (code.includes("\0virtual:vite-rsc/import-rsc")) {
          const replacement = path.relative(
            path.join("dist/ssr", chunk.fileName, ".."),
            path.join("dist/rsc", "index.js"),
          );
          code = code.replace("\0virtual:vite-rsc/import-rsc", replacement);
          return { code };
        }
        if (code.includes("\0virtual:vite-rsc/import-ssr")) {
          const replacement = path.relative(
            path.join("dist/rsc", chunk.fileName, ".."),
            path.join("dist/ssr", "index.js"),
          );
          code = code.replace("\0virtual:vite-rsc/import-ssr", replacement);
          return { code };
        }
        return;
      },
    },
    {
      name: "rsc:virtual:vite-rsc/assets-manifest",
      resolveId(source) {
        if (source === "virtual:vite-rsc/assets-manifest") {
          return {
            id: `\0` + source,
            external: this.environment.mode === "build",
          };
        }
      },
      load(id) {
        if (id === "\0virtual:vite-rsc/assets-manifest") {
          assert(this.environment.name !== "client");
          const manifest: AssetsManifest = {
            entry: {
              bootstrapModules: ["/@id/__x00__virtual:vite-rsc/browser-entry"],
              deps: {
                js: [],
                css: entries.css ? [entries.css] : [],
              },
            },
            clientReferenceDeps: {},
          };
          return `export default ${JSON.stringify(manifest, null, 2)}`;
        }
      },
      // client build
      generateBundle(_options, bundle) {
        if (this.environment.name === "client") {
          const assetDeps = collectAssetDeps(bundle);
          const clientReferenceDeps: Record<string, AssetDeps> = {};
          for (const [key, id] of Object.entries(clientReferences)) {
            const deps = assetDeps[id]?.deps;
            if (deps) {
              clientReferenceDeps[key] = deps;
            }
          }
          const entry = assetDeps["\0virtual:vite-rsc/browser-entry"]!;
          const manifest: AssetsManifest = {
            entry: {
              bootstrapModules: [`/${entry.chunk.fileName}`],
              deps: entry.deps,
            },
            clientReferenceDeps,
          };
          this.emitFile({
            type: "asset",
            fileName: "__vite_rsc_assets_manifest.js",
            source: `export default ${JSON.stringify(manifest, null, 2)}`,
          });
        }
      },
      // non-client builds can load assets manifest as external
      renderChunk(code, chunk) {
        if (code.includes("\0virtual:vite-rsc/assets-manifest")) {
          assert(this.environment.name !== "client");
          const replacement = path.relative(
            path.join(
              this.environment.config.build.outDir,
              chunk.fileName,
              "..",
            ),
            path.join(
              config.environments.client!.build.outDir,
              "__vite_rsc_assets_manifest.js",
            ),
          );
          code = code.replace(
            "\0virtual:vite-rsc/assets-manifest",
            replacement,
          );
          return { code };
        }
        return;
      },
    },
    createVirtualPlugin("vite-rsc/browser-entry", function () {
      let code = "";
      if (entries.css) {
        code += `import ${JSON.stringify(entries.css)};\n`;
      }
      if (this.environment.mode === "dev") {
        code += `
          import RefreshRuntime from "/@react-refresh";
          RefreshRuntime.injectIntoGlobalHook(window);
          window.$RefreshReg$ = () => {};
          window.$RefreshSig$ = () => (type) => type;
          window.__vite_plugin_react_preamble_installed__ = true;
          await import(${JSON.stringify(entries.browser)});
        `;
      } else {
        code += `import ${JSON.stringify(entries.browser)};\n`;
      }
      return code;
    }),
    {
      // make `AsyncLocalStorage` available globally for React request context on edge build (e.g. React.cache, ssr preload)
      // https://github.com/facebook/react/blob/f14d7f0d2597ea25da12bcf97772e8803f2a394c/packages/react-server/src/forks/ReactFlightServerConfig.dom-edge.js#L16-L19
      name: "inject-async-local-storage",
      async configureServer() {
        const __viteRscAyncHooks = await import("node:async_hooks");
        (globalThis as any).AsyncLocalStorage =
          __viteRscAyncHooks.AsyncLocalStorage;
      },
      banner(chunk) {
        if (
          (this.environment.name === "ssr" ||
            this.environment.name === "rsc") &&
          this.environment.mode === "build" &&
          chunk.isEntry
        ) {
          return `\
            import * as __viteRscAyncHooks from "node:async_hooks";
            globalThis.AsyncLocalStorage = __viteRscAyncHooks.AsyncLocalStorage;
          `;
        }
        return "";
      },
    },
    ...vitePluginRscCore(),
    ...vitePluginUseClient({ clientPackages }),
    ...vitePluginUseServer(),
    ...vitePluginFindSourceMapURL(),
    vitePluginSilenceDirectiveBuildWarning(),
  ];
}

function hashString(v: string) {
  return createHash("sha256").update(v).digest().toString("hex").slice(0, 12);
}

async function normalizeReferenceId(id: string, name: "client" | "rsc") {
  if (!server) {
    return hashString(path.relative(config.root, id));
  }

  // align with how Vite import analysis would rewrite id
  // to avoid double modules on browser and ssr.
  const environment = server.environments[name]!;
  return normalizeViteImportAnalysisUrl(environment, id);
}

function vitePluginUseClient({
  clientPackages = [],
}: { clientPackages?: string[] }): Plugin[] {
  // TODO: tree shaking can be done for non client package too.
  const clientPackageMeta: Record<
    string,
    { source: string; exportNames: string[]; renderedExports: string[] }
  > = {};

  return [
    {
      name: "rsc:use-client",
      async transform(code, id) {
        if (this.environment.name !== "rsc") return;
        if (!code.includes("use client")) return;
        if (buildScan) return;

        const ast = await parseAstAsync(code);

        // [during dev]
        // key = normalized import id
        // value = (not used)

        // [during build]
        // key = hashed id
        // value = id

        // ++++ client package +++
        // [during dev]
        // key = virtual id
        // value = (not used)

        // [during build]
        // key = hashed id
        // value = virtual id

        let referenceKey: string;
        let referenceValue = id;
        const clientPackage = clientPackageMeta[id];
        if (clientPackage) {
          const source = clientPackage.source;
          if (this.environment.mode === "build") {
            referenceKey = hashString(source);
            referenceValue = `virtual:vite-rsc/client-package-proxy/${source}`;
          } else {
            referenceKey = `/@id/__x00__virtual:vite-rsc/client-package-proxy/${source}`;
          }
        } else {
          referenceKey = await normalizeReferenceId(id, "client");
        }

        const result = transformDirectiveProxyExport(ast, {
          directive: "use client",
          runtime: (name) =>
            `$$ReactServer.registerClientReference({}, ${JSON.stringify(referenceKey)}, ${JSON.stringify(name)})`,
        });
        if (!result) return;
        const { output, exportNames } = result;
        if (clientPackage) {
          clientPackage.exportNames = exportNames;
        }
        clientReferences[referenceKey] = referenceValue;
        output.prepend(`import * as $$ReactServer from "${PKG_NAME}/rsc";\n`);
        return { code: output.toString(), map: { mappings: "" } };
      },
    },
    createVirtualPlugin("vite-rsc/client-references", function () {
      if (this.environment.mode === "dev") {
        return { code: `export {}`, map: null };
      }
      let code = generateDynamicImportCode(clientReferences);
      return { code, map: null };
    }),
    {
      name: "rsc:virtual-client-package",
      resolveId: {
        order: "pre",
        async handler(source, importer, options) {
          if (
            this.environment.name === "rsc" &&
            clientPackages.includes(source)
          ) {
            const resolved = await this.resolve(source, importer, options);
            if (resolved) {
              clientPackageMeta[resolved.id] = {
                source,
                exportNames: [],
                renderedExports: [],
              };
              return resolved;
            }
          }
          if (source.startsWith("virtual:vite-rsc/client-package-proxy/")) {
            return "\0" + source;
          }
        },
      },
      async load(id) {
        if (id.startsWith("\0virtual:vite-rsc/client-package-proxy/")) {
          const source = id.slice(
            "\0virtual:vite-rsc/client-package-proxy/".length,
          );
          const meta = Object.values(clientPackageMeta).find(
            (v) => v.source === source,
          )!;
          const exportNames =
            this.environment.mode === "build"
              ? meta.renderedExports
              : meta.exportNames;
          return `export {${exportNames.join(",")}} from ${JSON.stringify(source)};\n`;
        }
      },
      generateBundle(_options, bundle) {
        if (this.environment.name !== "rsc") return;

        // track used exports of client references in rsc build
        // to tree shake unused exports in browser and ssr build
        for (const chunk of Object.values(bundle)) {
          if (chunk.type === "chunk") {
            for (const [id, mod] of Object.entries(chunk.modules)) {
              const meta = clientPackageMeta[id];
              if (meta) {
                meta.renderedExports = mod.renderedExports;
              }
            }
          }
        }
      },
    },
  ];
}

function vitePluginUseServer(): Plugin[] {
  // TODO: reject non async function export
  return [
    {
      name: "rsc:use-server",
      async transform(code, id) {
        if (id.includes("/.vite/")) return;
        if (!code.includes("use server")) return;
        const ast = await parseAstAsync(code);
        const normalizedId = await normalizeReferenceId(id, "rsc");
        if (this.environment.name === "rsc") {
          const { output } = transformServerActionServer(code, ast, {
            runtime: (value, name) =>
              `$$ReactServer.registerServerReference(${value}, ${JSON.stringify(normalizedId)}, ${JSON.stringify(name)})`,
            rejectNonAsyncFunction: true,
          });
          if (!output.hasChanged()) return;
          serverReferences[normalizedId] = id;
          output.prepend(`import * as $$ReactServer from "${PKG_NAME}/rsc";\n`);
          return {
            code: output.toString(),
            map: output.generateMap({ hires: "boundary" }),
          };
        } else {
          const result = transformDirectiveProxyExport(ast, {
            code,
            runtime: (name) =>
              `$$ReactClient.createServerReference(` +
              `${JSON.stringify(normalizedId + "#" + name)},` +
              `$$ReactClient.callServer, ` +
              `undefined, ` +
              `$$ReactClient.findSourceMapURL, ` +
              `${JSON.stringify(name)})`,
            directive: "use server",
            rejectNonAsyncFunction: true,
          });
          const output = result?.output;
          if (!output?.hasChanged()) return;
          serverReferences[normalizedId] = id;
          const name = this.environment.name === "client" ? "browser" : "ssr";
          output.prepend(
            `import * as $$ReactClient from "${PKG_NAME}/${name}";\n`,
          );
          return {
            code: output.toString(),
            map: output.generateMap({
              hires: "boundary",
              includeContent: true,
            }),
          };
        }
      },
    },
    createVirtualPlugin("vite-rsc/server-references", function () {
      if (this.environment.mode === "dev") {
        return { code: `export {}`, map: null };
      }
      const code = generateDynamicImportCode(serverReferences);
      return { code, map: null };
    }),
  ];
}

function createVirtualPlugin(name: string, load: Plugin["load"]) {
  name = "virtual:" + name;
  return {
    name: `rsc:virtual-${name}`,
    resolveId(source, _importer, _options) {
      return source === name ? "\0" + name : undefined;
    },
    load(id, options) {
      if (id === "\0" + name) {
        return (load as Function).apply(this, [id, options]);
      }
    },
  } satisfies Plugin;
}

// silence warning due to "use ..." directives
// https://github.com/vitejs/vite-plugin-react/blob/814ed8043d321f4b4679a9f4a781d1ed14f185e4/packages/plugin-react/src/index.ts#L303
function vitePluginSilenceDirectiveBuildWarning(): Plugin {
  return {
    name: "rsc:silence-directive-build-warning",
    enforce: "post",
    config(config, _env) {
      return {
        build: {
          rollupOptions: {
            onwarn(warning, defaultHandler) {
              // https://github.com/vitejs/vite/issues/15012#issuecomment-1948550039
              if (
                warning.code === "SOURCEMAP_ERROR" &&
                warning.message.includes("(1:0)")
              ) {
                return;
              }
              // https://github.com/TanStack/query/pull/5161#issuecomment-1506683450
              if (
                warning.code === "MODULE_LEVEL_DIRECTIVE" &&
                (warning.message.includes(`use client`) ||
                  warning.message.includes(`use server`))
              ) {
                return;
              }
              if (config.build?.rollupOptions?.onwarn) {
                config.build.rollupOptions.onwarn(warning, defaultHandler);
              } else {
                defaultHandler(warning);
              }
            },
          },
        },
      };
    },
  };
}

function generateDynamicImportCode(map: Record<string, string>) {
  let code = Object.entries(map)
    .map(
      ([key, id]) =>
        `${JSON.stringify(key)}: () => import(${JSON.stringify(id)}),`,
    )
    .join("\n");
  return `export default {${code}};\n`;
}

//
// collect client reference dependency chunk for modulepreload
//

export type AssetsManifest = {
  entry: { bootstrapModules: string[]; deps: AssetDeps };
  clientReferenceDeps: Record<string, AssetDeps>;
};

type AssetDeps = {
  js: string[];
  css: string[];
};

function collectAssetDeps(bundle: Rollup.OutputBundle) {
  const map: Record<string, { chunk: Rollup.OutputChunk; deps: AssetDeps }> =
    {};
  for (const chunk of Object.values(bundle)) {
    if (chunk.type === "chunk" && chunk.facadeModuleId) {
      map[chunk.facadeModuleId] = {
        chunk,
        deps: collectAssetDepsInner(chunk.fileName, bundle),
      };
    }
  }
  return map;
}

function collectAssetDepsInner(
  fileName: string,
  bundle: Rollup.OutputBundle,
): AssetDeps {
  const visited = new Set<string>();
  const css: string[] = [];

  function recurse(k: string) {
    if (visited.has(k)) return;
    visited.add(k);
    const v = bundle[k];
    assert(v);
    if (v.type === "chunk") {
      css.push(...(v.viteMetadata?.importedCss ?? []));
      for (const k2 of v.imports) {
        recurse(k2);
      }
    }
  }

  recurse(fileName);
  return {
    js: [...visited].map((file) => `/${file}`),
    css: [...new Set(css)].map((file) => `/${file}`),
  };
}

//
// support findSourceMapURL
// https://github.com/facebook/react/pull/29708
// https://github.com/facebook/react/pull/30741
//

import fs from "node:fs";
import { fileURLToPath } from "node:url";

export function vitePluginFindSourceMapURL(): Plugin[] {
  return [
    {
      name: "rsc:findSourceMapURL",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const url = new URL(req.url!, `http://localhost`);
          if (url.pathname === "/__vite_rsc_findSourceMapURL") {
            let filename = url.searchParams.get("filename")!;
            let environmentName = url.searchParams.get("environmentName")!;
            try {
              const map = await findSourceMapURL(
                server,
                filename,
                environmentName,
              );
              res.setHeader("content-type", "application/json");
              if (!map) res.statusCode = 404;
              res.end(JSON.stringify(map ?? {}));
            } catch (e) {
              next(e);
            }
            return;
          }
          next();
        });
      },
    },
  ];
}

export async function findSourceMapURL(
  server: ViteDevServer,
  filename: string,
  environmentName: string,
): Promise<object | undefined> {
  // this is likely server external (i.e. outside of Vite processing)
  if (filename.startsWith("file://")) {
    filename = fileURLToPath(filename);
    if (fs.existsSync(filename)) {
      // line-by-line identity source map
      const content = fs.readFileSync(filename, "utf-8");
      return {
        version: 3,
        sources: [filename],
        sourcesContent: [content],
        mappings: "AAAA" + ";AACA".repeat(content.split("\n").length),
      };
    }
    return;
  }

  // server component stack, replace log, `registerServerReference`, etc...
  let mod: EnvironmentModuleNode | undefined;
  let map:
    | NonNullable<EnvironmentModuleNode["transformResult"]>["map"]
    | undefined;
  if (environmentName === "Server") {
    mod = server.environments.rsc!.moduleGraph.getModuleById(filename);
    // React extracts stacktrace via resetting `prepareStackTrace` on the server
    // and let browser devtools handle the mapping.
    // https://github.com/facebook/react/blob/4a36d3eab7d9bbbfae62699989aa95e5a0297c16/packages/react-server/src/ReactFlightStackConfigV8.js#L15-L20
    // This means it has additional +2 line offset due to Vite's module runner
    // function wrapper. We need correct it just like Vite module runner.
    // https://github.com/vitejs/vite/blob/d94e7b25564abb81ab7b921d4cd44d0f0d22fec4/packages/vite/src/shared/utils.ts#L58-L69
    // https://github.com/vitejs/vite/blob/d94e7b25564abb81ab7b921d4cd44d0f0d22fec4/packages/vite/src/node/ssr/fetchModule.ts#L142-L146
    map = mod?.transformResult?.map;
    if (map && map.mappings) {
      map = { ...map, mappings: (";;" + map.mappings) as any };
    }
  }

  // `createServerReference(... findSourceMapURL ...)` called on browser
  if (environmentName === "Client") {
    try {
      const url = new URL(filename).pathname;
      mod = server.environments.client.moduleGraph.urlToModuleMap.get(url);
      map = mod?.transformResult?.map;
    } catch (e) {}
  }

  if (mod && map) {
    // fix sources to match Vite module url
    return { ...map, sources: [mod.url] };
  }
}
