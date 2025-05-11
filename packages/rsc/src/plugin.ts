import assert from "node:assert";
import { createHash } from "node:crypto";
import path from "node:path";
import {
  transformDirectiveProxyExport,
  transformServerActionServer,
} from "@hiogawa/transforms";
import { createRequestListener } from "@mjackson/node-fetch-server";
import {
  DevEnvironment,
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
let serverReferences: Record<string, string> = {};
let server: ViteDevServer;
let config: ResolvedConfig;
let viteSsrRunner: ModuleRunner;
let viteRscRunner: ModuleRunner;

type ClientReferenceMeta = {
  importId: string;
  // same as `importId` during dev. hashed id during build.
  referenceKey: string;
  packageSource?: string;
  // build only for tree-shaking unused export
  exportNames: string[];
  renderedExports: string[];
};
const clientReferenceMetaMap: Record</* id */ string, ClientReferenceMeta> = {};

const PKG_NAME = "@hiogawa/vite-rsc";
const ENTRIES = {
  browser: "virtual:vite-rsc/entry-browser",
  rsc: "virtual:vite-rsc/entry-rsc",
  ssr: "virtual:vite-rsc/entry-ssr",
};

export default function vitePluginRsc({
  entries,
  clientPackages,
}: {
  entries: {
    browser: string;
    rsc: string;
    ssr: string;
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
                  input: { index: ENTRIES.browser },
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
                  input: { index: ENTRIES.ssr },
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
                  input: { index: ENTRIES.rsc },
                },
              },
            },
          },
          builder: {
            sharedPlugins: true,
            async buildApp(builder) {
              builder.environments.rsc!.config.build.write = false;
              builder.environments.ssr!.config.build.write = false;
              await builder.build(builder.environments.rsc!);
              await builder.build(builder.environments.ssr!);
              builder.environments.rsc!.config.build.write = true;
              builder.environments.ssr!.config.build.write = true;
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

        // crawl packages with "react" in "peerDependencies"
        // see https://github.com/svitejs/vitefu/blob/d8d82fa121e3b2215ba437107093c77bde51b63b/src/index.js#L95-L101
        const result = await crawlFrameworkPkgs({
          root: process.cwd(),
          isBuild: env.command === "build",
          isFrameworkPkgByJson(pkgJson) {
            if (
              [PKG_NAME, "react-dom", "react-server-dom-webpack"].includes(
                pkgJson.name,
              )
            ) {
              return;
            }
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
              const mod = await viteRscRunner.import(ENTRIES.rsc);
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
        // css file imported by anywhere sould work based on default hmr
        if (isCSSRequest(ctx.file)) return;

        const ids = ctx.modules.map((mod) => mod.id).filter((v) => v !== null);
        if (ids.length === 0) return;

        if (!ids.some((id) => clientReferenceMetaMap[id])) {
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
          return `export default () => __viteRscRunner.import(${JSON.stringify(ENTRIES.rsc)})`;
        }
        if (id === "\0virtual:vite-rsc/import-ssr") {
          return `export default () => __viteSsrRunner.import(${JSON.stringify(ENTRIES.ssr)})`;
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
              bootstrapModules: ["/@id/__x00__" + ENTRIES.browser],
              deps: {
                js: [],
                css: [],
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
          for (const [id, meta] of Object.entries(clientReferenceMetaMap)) {
            const deps = assetDeps[id]?.deps;
            if (deps) {
              clientReferenceDeps[meta.referenceKey] = deps;
            }
          }
          const entry = assetDeps["\0" + ENTRIES.browser]!;
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
    createVirtualPlugin(ENTRIES.browser.slice("virtual:".length), function () {
      let code = "";
      code += `import "virtual:vite-rsc/rsc-css-browser";\n`;
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
      // wrap module runner entry with virtual to avoid bugs such as
      // https://github.com/vitejs/vite/issues/19975
      name: "rsc:virtual-entries",
      enforce: "pre",
      resolveId(source, importer, options) {
        if (source === ENTRIES.rsc) {
          return this.resolve(entries.rsc, importer, options);
        }
        if (source === ENTRIES.ssr) {
          return this.resolve(entries.ssr, importer, options);
        }
      },
    },
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
    ...vitePluginRscCss({ entries: { rsc: ENTRIES.rsc } }),
    vitePluginSilenceDirectiveBuildWarning(),
  ];
}

function hashString(v: string) {
  return createHash("sha256").update(v).digest().toString("hex").slice(0, 12);
}

function normalizeReferenceId(id: string, name: "client" | "rsc") {
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
  const packageSources = new Map<string, string>();

  return [
    {
      name: "rsc:use-client",
      async transform(code, id) {
        if (this.environment.name !== "rsc") return;
        if (!code.includes("use client")) return;

        const ast = await parseAstAsync(code);

        let importId: string;
        let referenceKey: string;
        const packageSource = packageSources.get(id);
        if (packageSource) {
          if (this.environment.mode === "dev") {
            importId = `/@id/__x00__virtual:vite-rsc/client-package-proxy/${packageSource}`;
            referenceKey = importId;
          } else {
            importId = packageSource;
            referenceKey = hashString(packageSource);
          }
        } else {
          if (this.environment.mode === "dev") {
            importId = normalizeViteImportAnalysisUrl(
              server.environments.client,
              id,
            );
            referenceKey = importId;
          } else {
            importId = id;
            referenceKey = hashString(path.relative(config.root, id));
          }
        }

        const result = transformDirectiveProxyExport(ast, {
          directive: "use client",
          runtime: (name) =>
            `$$ReactServer.registerClientReference({}, ${JSON.stringify(referenceKey)}, ${JSON.stringify(name)})`,
        });
        if (!result) return;
        const { output, exportNames } = result;
        clientReferenceMetaMap[id] = {
          importId,
          referenceKey,
          packageSource,
          exportNames,
          renderedExports: [],
        };
        output.prepend(`import * as $$ReactServer from "${PKG_NAME}/rsc";\n`);
        return { code: output.toString(), map: { mappings: "" } };
      },
    },
    createVirtualPlugin("vite-rsc/client-references", function () {
      if (this.environment.mode === "dev") {
        return { code: `export default {}`, map: null };
      }
      let code = "";
      for (const meta of Object.values(clientReferenceMetaMap)) {
        // vite/rollup can apply tree-shaking to dynamic import of this form
        const key = JSON.stringify(meta.referenceKey);
        const id = JSON.stringify(meta.importId);
        const exports = meta.renderedExports.join(",");
        code += `
          ${key}: async () => {
            const {${exports}} = await import(${id});
            return {${exports}};
          },
        `;
      }
      code = `export default {${code}};\n`;
      console.log(code);
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
              packageSources.set(resolved.id, source);
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
          assert(this.environment.mode === 'dev')
          const source = id.slice(
            "\0virtual:vite-rsc/client-package-proxy/".length,
          );
          const meta = Object.values(clientReferenceMetaMap).find(
            (v) => v.packageSource === source,
          )!;
          const exportNames = meta.exportNames
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
              const meta = clientReferenceMetaMap[id];
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
  return [
    {
      name: "rsc:use-server",
      async transform(code, id) {
        if (!code.includes("use server")) return;
        const ast = await parseAstAsync(code);
        const normalizedId = normalizeReferenceId(id, "rsc");
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
            map: output.generateMap({ hires: "boundary" }),
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

export type AssetDeps = {
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
    // function wrapper. We need to correct it just like Vite module runner.
    // https://github.com/vitejs/vite/blob/d94e7b25564abb81ab7b921d4cd44d0f0d22fec4/packages/vite/src/shared/utils.ts#L58-L69
    // https://github.com/vitejs/vite/blob/d94e7b25564abb81ab7b921d4cd44d0f0d22fec4/packages/vite/src/node/ssr/fetchModule.ts#L142-L146
    map = mod?.transformResult?.map;
    if (map && map.mappings) {
      map = { ...map, mappings: (";;" + map.mappings) as any };
    }
  }

  const base = server.config.base.slice(0, -1);

  // `createServerReference(... findSourceMapURL ...)` called on browser
  if (environmentName === "Client") {
    try {
      const url = new URL(filename).pathname.slice(base.length);
      mod = server.environments.client.moduleGraph.urlToModuleMap.get(url);
      map = mod?.transformResult?.map;
    } catch (e) {}
  }

  if (mod && map) {
    // fix sources to match Vite's module url on browser
    return { ...map, sources: [base + mod.url] };
  }
}

//
// css support
//

export function vitePluginRscCss({
  entries,
}: { entries: { rsc: string } }): Plugin[] {
  // this approach likely misses css files found in dynaimic import of server components
  // during first SSR after server start. (e.g. react router's lazy server routes)
  // however, frameworks should be able to cover such cases based on their own convention.

  function collectCss(environment: DevEnvironment, entryId: string) {
    const visited = new Set<string>();
    const cssIds = new Set<string>();

    function recurse(id: string) {
      if (visited.has(id)) {
        return;
      }
      visited.add(id);
      const mod = environment.moduleGraph.getModuleById(id);
      for (const next of mod?.importedModules ?? []) {
        if (next.id) {
          if (isCSSRequest(next.id)) {
            cssIds.add(next.id);
          } else {
            recurse(next.id);
          }
        }
      }
    }

    recurse(entryId);

    const hrefs = [...cssIds].map((id) =>
      normalizeViteImportAnalysisUrl(server.environments.client, id),
    );
    return { ids: [...cssIds], hrefs };
  }

  async function collectCssByUrl(
    environment: DevEnvironment,
    entryUrl: string,
  ) {
    const entryMod = await environment.moduleGraph.getModuleByUrl(entryUrl);
    return collectCss(environment, entryMod!.id!);
  }

  function invalidateModule(environment: DevEnvironment, id: string) {
    const mod = environment.moduleGraph.getModuleById(id);
    if (mod) {
      environment.moduleGraph.invalidateModule(mod);
    }
  }

  // collect during rsc build and pass it to browser build
  const rscCssIdsBuild = new Set<string>();

  return [
    {
      name: "rsc:css",
      hotUpdate(ctx) {
        if (this.environment.name === "rsc" && ctx.modules.length > 0) {
          // simple virtual invalidation to ensure fresh css list
          invalidateModule(
            server.environments.ssr,
            "\0virtual:vite-rsc/css/rsc",
          );
          invalidateModule(
            server.environments.client,
            "\0virtual:vite-rsc/rsc-css-browser",
          );
        }
      },
      transform(_code, id) {
        if (
          this.environment.mode === "build" &&
          this.environment.name === "rsc"
        ) {
          if (isCSSRequest(id)) {
            rscCssIdsBuild.add(id);
          }
        }
      },
    },
    createVirtualPlugin("vite-rsc/rsc-css", async function () {
      assert(this.environment.name === "rsc");
      if (this.environment.mode === "build") {
        // during build, css are injected through AssetsManifest.entry.deps.css
        return `export default []`;
      }
      const { hrefs } = await collectCssByUrl(
        server.environments.rsc!,
        entries.rsc,
      );
      return `export default ${JSON.stringify(hrefs, null, 2)}`;
    }),
    createVirtualPlugin("vite-rsc/rsc-css-browser", async function () {
      assert(this.environment.name === "client");
      let ids: string[];
      if (this.environment.mode === "build") {
        ids = [...rscCssIdsBuild];
      } else {
        const collected = await collectCssByUrl(
          server.environments.rsc!,
          entries.rsc,
        );
        ids = collected.ids;
      }
      ids = ids.map((id) => id.replace(/^\0/, ""));
      return ids.map((id) => `import ${JSON.stringify(id)};\n`).join("");
    }),
    {
      name: "rsc:css/dev-ssr-virtual",
      resolveId(source) {
        if (source.startsWith("virtual:vite-rsc/css/dev-ssr/")) {
          return "\0" + source;
        }
      },
      async load(id) {
        if (id.startsWith("\0virtual:vite-rsc/css/dev-ssr/")) {
          id = id.slice("\0virtual:vite-rsc/css/dev-ssr/".length);
          const mod =
            await server.environments.ssr.moduleGraph.getModuleByUrl(id);
          if (!mod?.id || !mod?.file) {
            return `export default []`;
          }
          const { hrefs } = collectCss(server.environments.ssr, mod.id);
          // invalidate virtual module on file change to reflect added/deleted css import
          this.addWatchFile(mod.file);
          return `export default ${JSON.stringify(hrefs)}`;
        }
      },
    },
  ];
}
