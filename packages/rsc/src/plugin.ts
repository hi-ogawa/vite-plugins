import assert from "node:assert";
import { createHash } from "node:crypto";
import path from "node:path";
import {
  getExportNames,
  transformDirectiveProxyExport,
  transformServerActionServer,
} from "@hiogawa/transforms";
import { createRequestListener } from "@mjackson/node-fetch-server";
import {
  type Manifest,
  type Plugin,
  type ResolvedConfig,
  RunnableDevEnvironment,
  type ViteDevServer,
  defaultServerConditions,
  parseAstAsync,
} from "vite";
import type { ModuleRunner } from "vite/module-runner";
import { crawlFrameworkPkgs } from "vitefu";
import { normalizeViteImportAnalysisUrl } from "./vite-utils";

// state for build orchestration
let browserManifest: Manifest;
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
    ssr: string;
    rsc: string;
  };
  // TODO: this can be heuristically cralwed from package.json.
  // TODO: this cannot tree shake unused exports.
  // TODO: in principle, same trick is needed from `"use server"` package.
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
              resolve: {
                conditions: ["react-server", ...defaultServerConditions],
                noExternal: [
                  "react",
                  "react-dom",
                  "react-server-dom-webpack",
                  PKG_NAME,
                  ...(clientPackages ?? []),
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
            noExternal: [
              "react",
              "react-dom",
              "react-server-dom-webpack",
              ...result.ssr.noExternal,
            ].sort(),
          },
          optimizeDeps: {
            include: [
              "react",
              "react/jsx-runtime",
              "react/jsx-dev-runtime",
              `react-server-dom-webpack/server.edge`,
            ],
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
      writeBundle(_options, bundle) {
        if (this.environment.name === "client") {
          const output = bundle[".vite/manifest.json"];
          assert(output && output.type === "asset");
          assert(typeof output.source === "string");
          browserManifest = JSON.parse(output.source);
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
    createVirtualPlugin("vite-rsc/ssr-assets", function () {
      assert(this.environment.name === "ssr");

      let bootstrapModules: string[] = [];
      if (this.environment.mode === "dev") {
        bootstrapModules = ["/@id/__x00__virtual:vite-rsc/browser-entry"];
      }
      if (this.environment.mode === "build") {
        bootstrapModules = [
          browserManifest["virtual:vite-rsc/browser-entry"]!.file,
        ];
      }
      return `export const bootstrapModules = ${JSON.stringify(bootstrapModules)}`;
    }),
    createVirtualPlugin("vite-rsc/browser-entry", function () {
      if (this.environment.mode === "dev") {
        return `
          import RefreshRuntime from "/@react-refresh";
          RefreshRuntime.injectIntoGlobalHook(window);
          window.$RefreshReg$ = () => {};
          window.$RefreshSig$ = () => (type) => type;
          window.__vite_plugin_react_preamble_installed__ = true;
          await import(${JSON.stringify(entries.browser)});
        `;
      } else {
        return `
          import ${JSON.stringify(entries.browser)};
        `;
      }
    }),
    {
      name: "patch-webpack",
      transform(code, id, _options) {
        if (
          this.environment?.name === "client" &&
          id.includes("react-server-dom-webpack") &&
          code.includes("__webpack_require__")
        ) {
          // avoid accessing `__webpack_require__` on import side effect
          // https://github.com/facebook/react/blob/a9bbe34622885ef5667d33236d580fe7321c0d8b/packages/react-server-dom-webpack/src/client/ReactFlightClientConfigBundlerWebpackBrowser.js#L16-L17
          code = code.replaceAll("__webpack_require__.u", "({}).u");
          return { code, map: null };
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
    ...vitePluginUseClient({ clientPackages }),
    ...vitePluginUseServer(),
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
  const clientPackageMeta: Record<
    string,
    { source: string; exportNames: string[] }
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
          clientPackage.exportNames = getExportNames(ast, {}).exportNames;
        } else {
          referenceKey = await normalizeReferenceId(id, "client");
        }

        let output = await transformDirectiveProxyExport(ast, {
          directive: "use client",
          id: referenceKey,
          runtime: "$$register",
        });
        if (!output) return;
        clientReferences[referenceKey] = referenceValue;
        output.prepend(`
          import * as $$ReactServer from "react-server-dom-webpack/server.edge";
          const $$register = (id, name) => $$ReactServer.registerClientReference({}, id, name);
        `);
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
              clientPackageMeta[resolved.id] = { source, exportNames: [] };
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
          const { exportNames } = Object.values(clientPackageMeta).find(
            (v) => v.source === source,
          )!;
          return `export {${exportNames.join(",")}} from ${JSON.stringify(source)};\n`;
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
        if (id.includes("/.vite/")) return;
        if (!code.includes("use server")) return;
        const ast = await parseAstAsync(code);
        const normalizedId = await normalizeReferenceId(id, "rsc");
        if (this.environment.name === "rsc") {
          const { output } = await transformServerActionServer(code, ast, {
            id: normalizedId,
            runtime: "$$register",
          });
          if (!output.hasChanged()) return;
          serverReferences[normalizedId] = id;
          output.prepend(`
            import * as $$ReactServer from "react-server-dom-webpack/server.edge";
            const $$register = (value, id, name) => {
              if (typeof value !== 'function') return value;
              return $$ReactServer.registerServerReference(value, id, name);
            }
          `);
          return {
            code: output.toString(),
            map: output.generateMap({ hires: "boundary" }),
          };
        } else {
          const output = await transformDirectiveProxyExport(ast, {
            id: normalizedId,
            runtime: "$$proxy",
            directive: "use server",
          });
          if (!output?.hasChanged()) return;
          serverReferences[normalizedId] = id;
          const name = this.environment.name === "client" ? "browser" : "edge";
          output.prepend(`
            import * as $$ReactClient from "react-server-dom-webpack/server.${name}";
            const $$proxy = (id, name) => $$ReactClient.createServerReference(${JSON.stringify(id + "#" + name)}, (...args) => __viteRscCallServer(...args))
          `);
          return { code: output.toString(), map: { mappings: "" } };
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
