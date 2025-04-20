import assert from "node:assert";
import { createHash } from "node:crypto";
import path from "node:path";
import {
  transformDirectiveProxyExport,
  transformServerActionServer,
} from "@hiogawa/transforms";
import {
  type Manifest,
  type Plugin,
  type ResolvedConfig,
  type Rollup,
  type ViteDevServer,
  createServerModuleRunner,
  defaultServerConditions,
  parseAstAsync,
} from "vite";
import { crawlFrameworkPkgs } from "vitefu";
import { normalizeViteImportAnalysisUrl } from "../vite-utils";
import { toNodeHandler } from "./utils/fetch";

// state for build orchestration
let browserManifest: Manifest;
let browserBundle: Rollup.OutputBundle;
let clientReferences: Record<string, string> = {};
let serverReferences: Record<string, string> = {};
let buildScan = false;
let server: ViteDevServer;
let config: ResolvedConfig;

const PKG_NAME = "@hiogawa/vite-rsc";

export default function vitePluginRsc(rscOptions: {
  client: string;
  server: string;
}): Plugin[] {
  return [
    {
      name: "rsc",
      config() {
        return {
          appType: "custom",
          environments: {
            client: {
              optimizeDeps: {
                include: [
                  "react-dom/client",
                  `react-server-dom-webpack/client.browser`,
                ],
                exclude: [PKG_NAME],
              },
              build: {
                manifest: true,
                outDir: "dist/client",
                rollupOptions: {
                  input: { index: "virtual:vite-rsc/browser-entry" },
                },
              },
            },
            ssr: {
              optimizeDeps: {
                exclude: [PKG_NAME],
              },
              resolve: {
                noExternal: [PKG_NAME],
              },
              build: {
                outDir: "dist/ssr",
                rollupOptions: {
                  input: { index: "virtual:vite-rsc/ssr-entry" },
                },
              },
            },
            rsc: {
              optimizeDeps: {
                exclude: [PKG_NAME],
              },
              resolve: {
                noExternal: [PKG_NAME],
                conditions: ["react-server", ...defaultServerConditions],
              },
              build: {
                outDir: "dist/rsc",
                rollupOptions: {
                  input: { index: rscOptions.server },
                },
              },
            },
          },
          builder: {
            // TODO: use globalThis to share state instead of sharedPlugins
            sharedPlugins: true,
            async buildApp(builder) {
              buildScan = true;
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
            return deps && ("react" in deps || "next" in deps);
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
    },
    {
      name: "ssr-middleware",
      configureServer(server_) {
        server = server_;
        const ssrRunner = createServerModuleRunner(server.environments.ssr, {
          hmr: false,
        });
        const rscRunner = createServerModuleRunner(server.environments.rsc!, {
          hmr: false,
        });
        globalThis.__viteRscSsrRunner = ssrRunner;
        return () => {
          server.middlewares.use(async (req, res, next) => {
            try {
              const mod = await rscRunner.import(rscOptions.server);
              await toNodeHandler(mod.default)(req, res);
            } catch (e) {
              next(e);
            }
          });
        };
      },
      async configurePreviewServer(server) {
        const mod = await import(
          /* @vite-ignore */ path.resolve("dist/rsc/index.js")
        );
        return () => {
          server.middlewares.use(async (req, res, next) => {
            try {
              await toNodeHandler(mod.default)(req, res);
            } catch (e) {
              next(e);
            }
          });
        };
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
          await import(${JSON.stringify(rscOptions.client)});
        `;
      } else {
        return `
          import ${JSON.stringify(rscOptions.client)};
        `;
      }
    }),
    createVirtualPlugin("vite-rsc/ssr-entry", function () {
      return `
        export * from "${PKG_NAME}/ssr";
      `;
    }),
    {
      // externalize `dist/ssr/index.js` import as relative path in rsc build
      name: "virtual:vite-rsc/build-ssr-entry",
      resolveId(source) {
        if (source === "virtual:vite-rsc/build-ssr-entry") {
          return { id: "__VIRTUAL_BUILD_SSR_ENTRY__", external: true };
        }
        return;
      },
      renderChunk(code, chunk) {
        if (code.includes("__VIRTUAL_BUILD_SSR_ENTRY__")) {
          const replacement = path.relative(
            "dist/rsc",
            path.join("dist/ssr", chunk.fileName),
          );
          code = code.replace("__VIRTUAL_BUILD_SSR_ENTRY__", replacement);
          return { code };
        }
        return;
      },
    },
    {
      name: "rsc-misc",
      hotUpdate(ctx) {
        if (this.environment.name === "rsc") {
          const cliendIds = new Set(Object.values(clientReferences));
          const ids = ctx.modules
            .map((mod) => mod.id)
            .filter((v) => v !== null);
          if (ids.length > 0) {
            // client reference id is also in react server module graph,
            // but we skip RSC HMR for this case since Client HMR handles it.
            if (!ids.some((id) => cliendIds.has(id))) {
              ctx.server.environments.client.hot.send({
                type: "custom",
                event: "rsc:update",
                data: {
                  file: ctx.file,
                },
              });
            }
          }
        }
      },
      writeBundle(_options, bundle) {
        if (this.environment.name === "client") {
          const output = bundle[".vite/manifest.json"];
          assert(output && output.type === "asset");
          assert(typeof output.source === "string");
          browserManifest = JSON.parse(output.source);
          browserBundle = bundle;
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
          this.environment.name === "rsc" &&
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

    ...vitePluginUseClient(),
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

function vitePluginUseClient(): Plugin[] {
  return [
    {
      name: vitePluginUseClient.name,
      async transform(code, id) {
        if (this.environment.name !== "rsc") return;
        if (!code.includes("use client")) return;
        if (buildScan) return;

        const ast = await parseAstAsync(code);
        const normalizedId = await normalizeReferenceId(id, "client");
        let output = await transformDirectiveProxyExport(ast, {
          directive: "use client",
          id: normalizedId,
          runtime: "$$register",
        });
        if (!output) return;
        clientReferences[normalizedId] = id;
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
      if (browserBundle) {
        const assetDeps = collectAssetDeps(browserBundle);
        const keyAssetDeps: Record<string, AssetDeps> = {};
        for (const [key, id] of Object.entries(clientReferences)) {
          const deps = assetDeps[id];
          if (deps) {
            keyAssetDeps[key] = deps;
          }
        }
        code += `export const assetDeps = ${JSON.stringify(keyAssetDeps)};\n`;
      }
      return { code, map: null };
    }),
  ];
}

function vitePluginUseServer(): Plugin[] {
  return [
    {
      name: vitePluginUseServer.name,
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
    name: `virtual-${name}`,
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
    name: vitePluginSilenceDirectiveBuildWarning.name,
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

export type AssetDeps = {
  js: string[];
  css: string[];
};

function collectAssetDeps(
  bundle: Rollup.OutputBundle,
): Record<string, AssetDeps> {
  const map: Record<string, AssetDeps> = {};
  for (const chunk of Object.values(bundle)) {
    if (chunk.type === "chunk" && chunk.facadeModuleId) {
      map[chunk.facadeModuleId] = collectAssetDepsInner(chunk.fileName, bundle);
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
      css.push(...(v.viteMetadata?.importedAssets ?? []));
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
