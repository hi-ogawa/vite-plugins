import assert from "node:assert";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  transformDirectiveProxyExport,
  transformServerActionServer,
} from "@hiogawa/transforms";
import { createRequestListener } from "@mjackson/node-fetch-server";
import MagicString from "magic-string";
import {
  type DevEnvironment,
  type EnvironmentModuleNode,
  type Plugin,
  type ResolvedConfig,
  type Rollup,
  type RunnableDevEnvironment,
  type ViteDevServer,
  defaultServerConditions,
  isCSSRequest,
  normalizePath,
  parseAstAsync,
} from "vite";
import type { ModuleRunner } from "vite/module-runner";
import { crawlFrameworkPkgs } from "vitefu";
import vitePluginRscCore from "./core/plugin";
import { generateEncryptionKey, toBase64 } from "./utils/encryption-utils";
import { normalizeViteImportAnalysisUrl } from "./vite-utils";

// state for build orchestration
let serverReferences: Record<string, string> = {};
let server: ViteDevServer;
let config: ResolvedConfig;
let viteSsrRunner: ModuleRunner;
let viteRscRunner: ModuleRunner;
let rscBundle: Rollup.OutputBundle;
let buildAssetsManifest: AssetsManifest | undefined;
const BUILD_ASSETS_MANIFEST_NAME = "__vite_rsc_assets_manifest.js";

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

const serverResourcesMetaMap: Record<string, { key: string }> = {};

const PKG_NAME = "@hiogawa/vite-rsc";

// dev-only wrapper virtual module of rollupOptions.input.index
const VIRTUAL_ENTRIES = {
  browser: "virtual:vite-rsc/entry-browser",
  rsc: "virtual:vite-rsc/entry-rsc",
  ssr: "virtual:vite-rsc/entry-ssr",
};

export default function vitePluginRsc(
  rscPluginOptions: {
    /**
     * shorthand for configuring `environments.(name).build.rollupOptions.input.index`
     */
    entries?: Partial<Record<"client" | "ssr" | "rsc", string>>;
    disableServerHandler?: boolean;
  } = {},
): Plugin[] {
  return [
    {
      name: "rsc",
      config() {
        return {
          appType: "custom",
          resolve: {
            // this allows transforms to safely inject `import "@hiogawa/vite-rsc/xxx"`
            // to the files outside of project root.
            // (e.g. react-router monorepo playground has "use client" in a linked dep.)
            dedupe: [PKG_NAME],
          },
          environments: {
            client: {
              build: {
                outDir: "dist/client",
                rollupOptions: {
                  input: rscPluginOptions.entries?.client && {
                    index: rscPluginOptions.entries.client,
                  },
                },
              },
              optimizeDeps: {
                include: [
                  "react-dom/client",
                  `${PKG_NAME}/vendor/react-server-dom/client.browser`,
                ],
                exclude: [PKG_NAME],
              },
            },
            ssr: {
              build: {
                outDir: "dist/ssr",
                rollupOptions: {
                  input: rscPluginOptions.entries?.ssr && {
                    index: rscPluginOptions.entries.ssr,
                  },
                },
              },
              resolve: {
                noExternal: [PKG_NAME],
              },
              optimizeDeps: {
                include: [`${PKG_NAME}/vendor/react-server-dom/client.edge`],
                exclude: [PKG_NAME],
              },
            },
            rsc: {
              build: {
                outDir: "dist/rsc",
                emitAssets: true,
                rollupOptions: {
                  input: rscPluginOptions.entries?.rsc && {
                    index: rscPluginOptions.entries.rsc,
                  },
                },
              },
              // `configEnvironment` below adds more `noExternal`
              resolve: {
                conditions: ["react-server", ...defaultServerConditions],
                noExternal: [
                  "react",
                  "react-dom",
                  `${PKG_NAME}/vendor/react-server-dom/server.edge`,
                  PKG_NAME,
                ],
              },
              optimizeDeps: {
                include: [
                  "react",
                  "react-dom",
                  "react/jsx-runtime",
                  "react/jsx-dev-runtime",
                  `${PKG_NAME}/vendor/react-server-dom/server.edge`,
                  `${PKG_NAME}/vendor/react-server-dom/client.edge`,
                ],
                exclude: [PKG_NAME],
              },
            },
          },
          builder: {
            sharedPlugins: true,
            sharedConfigBuild: true,
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

              // emit manifest to non-client build directly
              // (makeing server build self-contained for cloudflare)
              const assetsManifestCode = `export default ${JSON.stringify(buildAssetsManifest, null, 2)}`;
              for (const name of ["ssr", "rsc"]) {
                const manifestPath = path.join(
                  config.environments[name]!.build.outDir,
                  BUILD_ASSETS_MANIFEST_NAME,
                );
                fs.writeFileSync(manifestPath, assetsManifestCode);
              }
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
            if ([PKG_NAME, "react-dom"].includes(pkgJson.name)) {
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

        if (rscPluginOptions.disableServerHandler) return;

        return () => {
          server.middlewares.use(async (req, res, next) => {
            try {
              const mod = await viteRscRunner.import(VIRTUAL_ENTRIES.rsc);
              createRequestListener(mod.default)(req, res);
            } catch (e) {
              next(e);
            }
          });
        };
      },
      async configurePreviewServer(server) {
        if (rscPluginOptions.disableServerHandler) return;

        const entry = pathToFileURL(path.resolve(`dist/rsc/index.js`)).href;
        const mod = await import(/* @vite-ignore */ entry);
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
        if (isCSSRequest(ctx.file)) {
          if (this.environment.name === "client") {
            // filter out `.css?direct` (injected by SSR) to avoid browser full reload
            // when changing non-self accepting css such as `module.css`.
            return ctx.modules.filter((m) => !m.id?.includes("?direct"));
          }
        }

        const ids = ctx.modules.map((mod) => mod.id).filter((v) => v !== null);
        if (ids.length === 0) return;

        // TODO: what if shared component?
        function isInsideClientBoundary(mods: EnvironmentModuleNode[]) {
          const visited = new Set<string>();
          function recurse(mod: EnvironmentModuleNode): boolean {
            if (!mod.id) return false;
            if (clientReferenceMetaMap[mod.id]) return true;
            if (visited.has(mod.id)) return false;
            visited.add(mod.id);
            for (const importer of mod.importers) {
              if (recurse(importer)) {
                return true;
              }
            }
            return false;
          }
          return mods.some((mod) => recurse(mod));
        }

        if (!isInsideClientBoundary(ctx.modules)) {
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
      // allow loading ssr entry module in rsc environment by
      // - dev:   rewriting to `__viteSsrRunner.import(...)`
      // - build: rewriting to external import of `import("../dist/ssr/...")`
      name: "rsc:load-ssr-module",
      transform(code) {
        if (code.includes("import.meta.viteRsc.loadSsrModule")) {
          const s = new MagicString(code);
          for (const match of code.matchAll(
            /import\.meta\.viteRsc\.loadSsrModule\((?:"([^"]+)"|'([^']+)')\)/g,
          )) {
            const entryName = match[1] || match[2];
            let replacement: string;
            if (this.environment.mode === "dev") {
              const source = getEntrySource(
                config.environments.ssr!,
                entryName,
              );
              replacement = `__viteSsrRunner.import(${JSON.stringify(source)})`;
            } else {
              replacement = JSON.stringify(
                "__vite_rsc_load_ssr_entry:" + entryName,
              );
            }
            s.overwrite(
              match.index!,
              match.index! + match[0].length,
              replacement,
            );
          }
          if (s.hasChanged()) {
            return {
              code: s.toString(),
              map: s.generateMap({ hires: "boundary" }),
            };
          }
        }
      },
      renderChunk(code, chunk) {
        if (code.includes("__vite_rsc_load_ssr_entry:")) {
          assert(this.environment.name === "rsc");
          code = code.replaceAll(
            /['"]__vite_rsc_load_ssr_entry:(\w+)['"]/g,
            (_match, name) => {
              const relativePath = path.relative(
                path.join("dist/rsc", chunk.fileName, ".."),
                path.join("dist/ssr", `${name}.js`),
              );
              return `(import(${JSON.stringify(normalizePath(relativePath))}))`;
            },
          );
          return { code };
        }
        return;
      },
    },
    {
      name: "rsc:virtual:vite-rsc/assets-manifest",
      resolveId(source) {
        if (source === "virtual:vite-rsc/assets-manifest") {
          if (this.environment.mode === "build") {
            return { id: source, external: true };
          }
          return `\0` + source;
        }
      },
      load(id) {
        if (id === "\0virtual:vite-rsc/assets-manifest") {
          assert(this.environment.name !== "client");
          assert(this.environment.mode === "dev");
          const entryUrl = assetsURL("@id/__x00__" + VIRTUAL_ENTRIES.browser);
          const manifest: AssetsManifest = {
            bootstrapScriptContent: `import(${JSON.stringify(entryUrl)})`,
            clientReferenceDeps: {},
          };
          return `export default ${JSON.stringify(manifest, null, 2)}`;
        }
      },
      // client build
      generateBundle(_options, bundle) {
        // copy assets from rsc build to client build
        if (this.environment.name === "rsc") {
          rscBundle = bundle;
        }

        if (this.environment.name === "client") {
          for (const asset of Object.values(rscBundle)) {
            if (asset.type === "asset") {
              this.emitFile({
                type: "asset",
                fileName: asset.fileName,
                source: asset.source,
              });
            }
          }

          const serverResources: Record<string, AssetDeps> = {};
          const rscAssetDeps = collectAssetDeps(rscBundle);
          for (const [id, meta] of Object.entries(serverResourcesMetaMap)) {
            serverResources[meta.key] = assetsURLOfDeps({
              js: [],
              css: rscAssetDeps[id]?.deps.css ?? [],
            });
          }

          const assetDeps = collectAssetDeps(bundle);
          const entry = Object.values(assetDeps).find(
            (v) => v.chunk.name === "index",
          );
          assert(entry);
          const entryUrl = assetsURL(entry.chunk.fileName);
          const clientReferenceDeps: Record<string, AssetDeps> = {};
          for (const [id, meta] of Object.entries(clientReferenceMetaMap)) {
            const deps: AssetDeps = assetDeps[id]?.deps ?? { js: [], css: [] };
            clientReferenceDeps[meta.referenceKey] = assetsURLOfDeps(
              mergeAssetDeps(deps, entry.deps),
            );
          }
          buildAssetsManifest = {
            bootstrapScriptContent: `import(${JSON.stringify(entryUrl)})`,
            clientReferenceDeps,
            serverResources,
          };
        }
      },
      // non-client builds can load assets manifest as external
      renderChunk(code, chunk) {
        if (code.includes("virtual:vite-rsc/assets-manifest")) {
          assert(this.environment.name !== "client");
          let replacement = path.relative(
            path.join(chunk.fileName, ".."),
            BUILD_ASSETS_MANIFEST_NAME,
          );
          replacement = normalizePath(replacement);
          if (!replacement.startsWith(".")) {
            replacement = "./" + replacement;
          }
          code = code.replaceAll(
            "virtual:vite-rsc/assets-manifest",
            () => replacement,
          );
          return { code };
        }
        return;
      },
    },
    createVirtualPlugin("vite-rsc/bootstrap-script-content", function () {
      assert(this.environment.name !== "client");
      return `
        import assetsManifest from "virtual:vite-rsc/assets-manifest";
        export default assetsManifest.bootstrapScriptContent;
      `;
    }),
    createVirtualPlugin(
      VIRTUAL_ENTRIES.browser.slice("virtual:".length),
      async function () {
        assert(this.environment.mode === "dev");
        let code = "";
        // enable hmr only when react plugin is available
        const resolved = await this.resolve("/@react-refresh");
        if (resolved) {
          code += `
            import RefreshRuntime from "/@react-refresh";
            RefreshRuntime.injectIntoGlobalHook(window);
            window.$RefreshReg$ = () => {};
            window.$RefreshSig$ = () => (type) => type;
            window.__vite_plugin_react_preamble_installed__ = true;
          `;
        }
        code += `await import("virtual:vite-rsc/entry-browser-inner");`;
        // TODO
        // should remove only the ones we injected during ssr, which are duplicated by browser imports for HMR.
        // technically this doesn't have to wait for "vite:beforeUpdate" and should do it right after browser css import.
        // TODO: there migth be a clever way to let Vite deduplicate itself.
        // cf. https://github.com/withastro/astro/blob/acb9b302f56e38833a1ab01147f7fde0bf967889/packages/astro/src/vite-plugin-astro-server/pipeline.ts#L133-L135
        code += `
          const ssrCss = document.querySelectorAll("link[rel='stylesheet']");
          import.meta.hot.on("vite:beforeUpdate", () => ssrCss.forEach(node => node.remove()));
        `;
        return code;
      },
    ),
    {
      // wrap module runner entry with virtual to avoid bugs such as
      // https://github.com/vitejs/vite/issues/19975
      name: "rsc:virtual-entries",
      enforce: "pre",
      async resolveId(source, _importer, options) {
        if (source === "virtual:vite-rsc/entry-browser-inner") {
          assert(this.environment.name === "client");
          assert(this.environment.mode === "dev");
          return this.resolve(
            getEntrySource(this.environment.config),
            undefined,
            options,
          );
        }
        if (source === VIRTUAL_ENTRIES.rsc) {
          assert(this.environment.name === "rsc");
          assert(this.environment.mode === "dev");
          return this.resolve(
            getEntrySource(this.environment.config),
            undefined,
            options,
          );
        }
        if (source === VIRTUAL_ENTRIES.ssr) {
          assert(this.environment.name === "ssr");
          assert(this.environment.mode === "dev");
          return this.resolve(
            getEntrySource(this.environment.config),
            undefined,
            options,
          );
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
    ...vitePluginUseClient(),
    ...vitePluginUseServer(),
    ...vitePluginFindSourceMapURL(),
    ...vitePluginRscCss(),
  ];
}

function getEntrySource(
  config: Pick<ResolvedConfig, "build">,
  name: string = "index",
) {
  const input = config.build.rollupOptions.input;
  assert(input);
  assert(
    typeof input === "object" &&
      !Array.isArray(input) &&
      name in input &&
      typeof input[name] === "string",
  );
  return input[name];
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

function vitePluginUseClient(): Plugin[] {
  const packageSources = new Map<string, string>();

  // https://github.com/vitejs/vite/blob/4bcf45863b5f46aa2b41f261283d08f12d3e8675/packages/vite/src/node/utils.ts#L175
  const bareImportRE = /^(?![a-zA-Z]:)[\w@](?!.*:\/\/)/;

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
            referenceKey = hashString(
              normalizePath(path.relative(config.root, id)),
            );
          }
        }

        const transformDirectiveProxyExport_ = withRollupError(
          this,
          transformDirectiveProxyExport,
        );
        const result = transformDirectiveProxyExport_(ast, {
          directive: "use client",
          runtime: (name) =>
            `$$ReactServer.registerClientReference(` +
            `() => { throw new Error("Unexpectedly client reference export '" + ${JSON.stringify(name)} + "' is called on server") },` +
            `${JSON.stringify(referenceKey)},` +
            `${JSON.stringify(name)})`,
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
        const exports = meta.renderedExports
          .map((name) => (name === "default" ? "default: _default" : name))
          .sort();
        code += `
          ${key}: async () => {
            const {${exports}} = await import(${id});
            return {${exports}};
          },
        `;
      }
      code = `export default {${code}};\n`;
      return { code, map: null };
    }),
    {
      name: "rsc:virtual-client-package",
      resolveId: {
        order: "pre",
        async handler(source, importer, options) {
          if (this.environment.name === "rsc" && bareImportRE.test(source)) {
            const resolved = await this.resolve(source, importer, options);
            if (resolved && resolved.id.includes("/node_modules/")) {
              packageSources.set(resolved.id, source);
              return resolved;
            }
          }
        },
      },
      async load(id) {
        if (id.startsWith("\0virtual:vite-rsc/client-package-proxy/")) {
          assert(this.environment.mode === "dev");
          const source = id.slice(
            "\0virtual:vite-rsc/client-package-proxy/".length,
          );
          const meta = Object.values(clientReferenceMetaMap).find(
            (v) => v.packageSource === source,
          )!;
          const exportNames = meta.exportNames;
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
      async configEnvironment(name, config, env) {
        if (name === "rsc" && !env.isPreview) {
          // define default encryption key at build time.
          // users can override e.g. by { define: { __VITE_RSC_ENCRYPTION_KEY__: 'process.env.MY_KEY' } }
          config.define ??= {};
          if (!config.define["__VITE_RSC_ENCRYPTION_KEY__"]) {
            const encryptionKey = await generateEncryptionKey();
            config.define["__VITE_RSC_ENCRYPTION_KEY__"] = JSON.stringify(
              toBase64(encryptionKey),
            );
          }
        }
      },
      async transform(code, id) {
        if (!code.includes("use server")) return;
        const ast = await parseAstAsync(code);
        const normalizedId = normalizeReferenceId(id, "rsc");
        if (this.environment.name === "rsc") {
          const transformServerActionServer_ = withRollupError(
            this,
            transformServerActionServer,
          );
          const { output } = transformServerActionServer_(code, ast, {
            runtime: (value, name) =>
              `$$ReactServer.registerServerReference(${value}, ${JSON.stringify(normalizedId)}, ${JSON.stringify(name)})`,
            rejectNonAsyncFunction: true,
            encode: (value) => `$$ReactServer.encryptActionBoundArgs(${value})`,
            decode: (value) =>
              `await $$ReactServer.decryptActionBoundArgs(${value})`,
          });
          if (!output.hasChanged()) return;
          serverReferences[normalizedId] = id;
          output.prepend(`import * as $$ReactServer from "${PKG_NAME}/rsc";\n`);
          return {
            code: output.toString(),
            map: output.generateMap({ hires: "boundary" }),
          };
        } else {
          const transformDirectiveProxyExport_ = withRollupError(
            this,
            transformDirectiveProxyExport,
          );
          const result = transformDirectiveProxyExport_(ast, {
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
            `import * as $$ReactClient from "${PKG_NAME}/react/${name}";\n`,
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

// Rethrow transform error through `this.error` with `error.pos` which is injected by `@hiogawa/transforms`
function withRollupError<F extends (...args: any[]) => any>(
  ctx: Rollup.TransformPluginContext,
  f: F,
): F {
  function processError(e: any): never {
    if (e && typeof e === "object" && typeof e.pos === "number") {
      return ctx.error(e, e.pos);
    }
    throw e;
  }
  return function (this: any, ...args: any[]) {
    try {
      const result = f.apply(this, args);
      if (result instanceof Promise) {
        return result.catch((e: any) => processError(e));
      }
      return result;
    } catch (e: any) {
      processError(e);
    }
  } as F;
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

function generateDynamicImportCode(map: Record<string, string>) {
  let code = Object.entries(map)
    .map(
      ([key, id]) =>
        `${JSON.stringify(key)}: () => import(${JSON.stringify(id)}),`,
    )
    .join("\n");
  return `export default {${code}};\n`;
}

// // https://github.com/vitejs/vite/blob/2a7473cfed96237711cda9f736465c84d442ddef/packages/vite/src/node/plugins/importAnalysisBuild.ts#L222-L230
function assetsURL(url: string) {
  return config.base + url;
}

function assetsURLOfDeps(deps: AssetDeps) {
  return {
    js: deps.js.map((href) => assetsURL(href)),
    css: deps.css.map((href) => assetsURL(href)),
  };
}

//
// collect client reference dependency chunk for modulepreload
//

export type AssetsManifest = {
  bootstrapScriptContent: string;
  clientReferenceDeps: Record<string, AssetDeps>;
  serverResources?: Record<string, { css: string[] }>;
};

export type AssetDeps = {
  js: string[];
  css: string[];
};

function mergeAssetDeps(a: AssetDeps, b: AssetDeps): AssetDeps {
  return {
    js: [...new Set([...a.js, ...b.js])],
    css: [...new Set([...a.css, ...b.css])],
  };
}

function collectAssetDeps(bundle: Rollup.OutputBundle) {
  const chunkToDeps = new Map<Rollup.OutputChunk, AssetDeps>();
  for (const chunk of Object.values(bundle)) {
    if (chunk.type === "chunk") {
      chunkToDeps.set(chunk, collectAssetDepsInner(chunk.fileName, bundle));
    }
  }
  const idToDeps: Record<
    string,
    { chunk: Rollup.OutputChunk; deps: AssetDeps }
  > = {};
  for (const [chunk, deps] of chunkToDeps.entries()) {
    for (const id of chunk.moduleIds) {
      idToDeps[id] = { chunk, deps };
    }
  }
  return idToDeps;
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
    assert(v, `Not found '${k}' in the bundle`);
    if (v.type === "chunk") {
      css.push(...(v.viteMetadata?.importedCss ?? []));
      for (const k2 of v.imports) {
        // server external imports is not in bundle
        if (k2 in bundle) {
          recurse(k2);
        }
      }
    }
  }

  recurse(fileName);
  return {
    js: [...visited],
    css: [...new Set(css)],
  };
}

//
// support findSourceMapURL
// https://github.com/facebook/react/pull/29708
// https://github.com/facebook/react/pull/30741
//

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

export function vitePluginRscCss(): Plugin[] {
  function collectCss(environment: DevEnvironment, entryId: string) {
    const visited = new Set<string>();
    const cssIds = new Set<string>();
    const visitedFiles = new Set<string>();

    function recurse(id: string) {
      if (visited.has(id)) {
        return;
      }
      visited.add(id);
      const mod = environment.moduleGraph.getModuleById(id);
      if (mod?.file) {
        visitedFiles.add(mod.file);
      }
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

    // this doesn't include ?t= query so that RSC <link /> won't keep adding styles.
    const hrefs = [...cssIds].map((id) =>
      normalizeViteImportAnalysisUrl(environment, id),
    );
    return { ids: [...cssIds], hrefs, visitedFiles: [...visitedFiles] };
  }

  return [
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
          const result = collectCss(server.environments.ssr, mod.id);
          // invalidate virtual module on js file changes to reflect added/deleted css import
          for (const file of [mod.file, ...result.visitedFiles]) {
            this.addWatchFile(file);
          }
          const hrefs = result.hrefs.map((href) => assetsURL(href.slice(1)));
          return `export default ${JSON.stringify(hrefs)}`;
        }
      },
    },
    {
      name: "rsc:importer-resources",
      async transform(code, id) {
        // TODO: use es-module-lexer
        if (code.includes("import.meta.viteRsc.loadCss")) {
          assert(this.environment.name === "rsc");
          const output = new MagicString(code);
          const importId = `virtual:vite-rsc/importer-resources?importer=${id}`;
          output.prepend(`import __vite_rsc_react__ from "react";`);
          output.replaceAll(
            "import.meta.viteRsc.loadCss",
            // wrap async component element
            `(() => __vite_rsc_react__.createElement(() => import(${JSON.stringify(importId)}).then(m => __vite_rsc_react__.createElement(m.Resources))))`,
          );
          return {
            code: output.toString(),
            map: output.generateMap({ hires: "boundary" }),
          };
        }
      },
      resolveId(source) {
        if (
          source.startsWith("virtual:vite-rsc/importer-resources?importer=")
        ) {
          assert(this.environment.name === "rsc");
          return "\0" + source;
        }
      },
      load(id) {
        if (id.startsWith("\0virtual:vite-rsc/importer-resources?importer=")) {
          const importer = id.slice(
            "\0virtual:vite-rsc/importer-resources?importer=".length,
          );
          if (this.environment.mode === "dev") {
            const result = collectCss(server.environments.rsc!, importer);
            const cssHrefs = result.hrefs.map((href) => href.slice(1));
            const jsHrefs = [
              "@id/__x00__virtual:vite-rsc/importer-resources-browser?importer=" +
                encodeURIComponent(importer),
            ];
            const deps = assetsURLOfDeps({ css: cssHrefs, js: jsHrefs });
            return generateResourcesCode(JSON.stringify(deps, null, 2));
          } else {
            const key = normalizePath(path.relative(config.root, importer));
            serverResourcesMetaMap[importer] = { key };
            return `
              import __vite_rsc_assets_manifest__ from "virtual:vite-rsc/assets-manifest";
              ${generateResourcesCode(`__vite_rsc_assets_manifest__.serverResources[${JSON.stringify(key)}]`)}
            `;
          }
        }
        if (
          id.startsWith(
            "\0virtual:vite-rsc/importer-resources-browser?importer=",
          )
        ) {
          assert(this.environment.name === "client");
          assert(this.environment.mode === "dev");
          let importer = id.slice(
            "\0virtual:vite-rsc/importer-resources-browser?importer=".length,
          );
          importer = decodeURIComponent(importer);
          const result = collectCss(server.environments.rsc!, importer);
          let code = result.ids
            .map((id) => id.replace(/^\0/, ""))
            .map((id) => `import ${JSON.stringify(id)};\n`)
            .join("");
          // ensure hmr boundary at this virtual since otherwise non-self accepting css
          // (e.g. css module) causes full reload
          code += `if (import.meta.hot) { import.meta.hot.accept() }\n`;
          return code;
        }
      },
      hotUpdate(ctx) {
        if (this.environment.name === "rsc") {
          const mods = collectModuleDependents(ctx.modules);
          for (const mod of mods) {
            if (mod.id) {
              const importer = mod.id;
              invalidteModuleById(
                server.environments.rsc!,
                `\0virtual:vite-rsc/importer-resources?importer=${importer}`,
              );
              invalidteModuleById(
                server.environments.client,
                `\0virtual:vite-rsc/importer-resources-browser?importer=${encodeURIComponent(importer)}`,
              );
            }
          }
        }
      },
    },
  ];
}

function invalidteModuleById(environment: DevEnvironment, id: string) {
  const mod = environment.moduleGraph.getModuleById(id);
  if (mod) {
    environment.moduleGraph.invalidateModule(mod);
  }
  return mod;
}

function collectModuleDependents(mods: EnvironmentModuleNode[]) {
  const visited = new Set<EnvironmentModuleNode>();
  function recurse(mod: EnvironmentModuleNode) {
    if (visited.has(mod)) return;
    visited.add(mod);
    for (const importer of mod.importers) {
      recurse(importer);
    }
  }
  for (const mod of mods) {
    recurse(mod);
  }
  return [...visited];
}

function generateResourcesCode(depsCode: string) {
  const ResourcesFn = (React: typeof import("react"), deps: AssetDeps) => {
    return function Resources() {
      return React.createElement(React.Fragment, null, [
        ...deps.css.map((href: string) =>
          React.createElement("link", {
            key: "css:" + href,
            rel: "stylesheet",
            precedence: "vite-rsc/importer-resources",
            href: href,
          }),
        ),
        // js is only for dev to forward css import on browser to have hmr
        ...deps.js.map((href: string) =>
          React.createElement("script", {
            key: "js:" + href,
            type: "module",
            async: true,
            src: href,
          }),
        ),
      ]);
    };
  };

  return `
    import __vite_rsc_react__ from "react";
    export const Resources = (${ResourcesFn.toString()})(__vite_rsc_react__, ${depsCode});
  `;
}
