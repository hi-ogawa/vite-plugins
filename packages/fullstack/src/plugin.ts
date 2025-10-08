import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MagicString from "magic-string";
import { toNodeHandler } from "srvx/node";
import { stripLiteral } from "strip-literal";
import {
  DevEnvironment,
  type EnvironmentModuleNode,
  type Plugin,
  type ResolvedConfig,
  type Rollup,
  type ViteDevServer,
  isCSSRequest,
  isRunnableDevEnvironment,
  normalizePath,
} from "vite";
import type { ImportAssetsOptions, ImportAssetsResult } from "../types/shared";
import {
  parseAssetsVirtual,
  parseIdQuery,
  toAssetsVirtual,
} from "./plugins/shared";
import {
  createVirtualPlugin,
  getEntrySource,
  hashString,
  normalizeRelativePath,
} from "./plugins/utils";
import {
  evalValue,
  normalizeViteImportAnalysisUrl,
} from "./plugins/vite-utils";

type FullstackPluginOptions = {
  /**
   * @default true
   */
  serverHandler?: boolean;
  /**
   * @default ["ssr"]
   */
  serverEnvironments?: string[];
  /**
   * @experimental
   */
  experimental?: {
    /**
     * @default true
     */
    devEagerTransform?: boolean;
    /**
     * Deduplicate CSS by processing all CSS imports only in client build.
     * When enabled, CSS imports from server/universal modules are tracked
     * and added as entries to the client build, preventing duplicate CSS
     * processing across builds.
     * @default false
     */
    deduplicateCss?: boolean;
  };
};

type ImportAssetsMeta = {
  id: string;
  key: string;
  importerEnvironment: string;
  isEntry: boolean;
};

export default function vitePluginFullstack(
  pluginOpts?: FullstackPluginOptions,
): Plugin[] {
  return [...serverHandlerPlugin(pluginOpts), ...assetsPlugin(pluginOpts)];
}

export function serverHandlerPlugin(
  pluginOpts?: FullstackPluginOptions,
): Plugin[] {
  return [
    {
      name: "fullstack:server-handler",
      apply: () => pluginOpts?.serverHandler !== false,
      config(userConfig, _env) {
        return {
          appType: userConfig.appType ?? "custom",
        };
      },
      configureServer(server) {
        const name = (pluginOpts?.serverEnvironments ?? ["ssr"])[0]!;
        const environment = server.environments[name]!;
        assert(isRunnableDevEnvironment(environment));
        const runner = environment.runner;
        return () => {
          server.middlewares.use(async (req, res, next) => {
            try {
              const source = getEntrySource(environment.config);
              const mod = await runner.import(source);
              req.url = req.originalUrl ?? req.url;
              await toNodeHandler(mod.default.fetch)(req, res);
            } catch (e) {
              next(e);
            }
          });
        };
      },
    },
  ];
}

export function assetsPlugin(pluginOpts?: FullstackPluginOptions): Plugin[] {
  let server: ViteDevServer;
  let resolvedConfig: ResolvedConfig;
  const importAssetsMetaMap: {
    [environment: string]: { [id: string]: ImportAssetsMeta };
  } = {};
  const bundleMap: { [environment: string]: Rollup.OutputBundle } = {};

  // Shared state for CSS deduplication between plugins
  const cssDeduplicationState = {
    serverModuleToCss: new Map<string, Set<string>>(),
    serverModuleToVirtualCssEntry: new Map<string, string>(),
    hashToServerModule: new Map<string, string>(),
  };

  async function processAssetsImport(
    ctx: Rollup.PluginContext,
    id: string,
    options: {
      environment: string;
      isEntry: boolean;
    },
  ) {
    if (ctx.environment.mode === "dev") {
      const result: ImportAssetsResult = {
        entry: undefined, // defined only on client
        js: [], // always empty
        css: [], // defined only on server
      };
      const environment = server.environments[options.environment];
      assert(environment, `Unknown environment: ${options.environment}`);
      if (options.environment === "client") {
        result.entry = normalizeViteImportAnalysisUrl(environment, id);
      }
      if (environment.name !== "client") {
        const collected = await collectCss(environment, id, {
          eager: pluginOpts?.experimental?.devEagerTransform ?? true,
        });
        result.css = collected.hrefs.map((href, i) => ({
          href,
          "data-vite-dev-id": collected.ids[i],
        }));
      }
      return JSON.stringify(result);
    } else {
      const map = (importAssetsMetaMap[options.environment] ??= {});
      const meta: ImportAssetsMeta = {
        id,
        // normalize key to have machine-independent build output
        key: path.relative(resolvedConfig.root, id),
        importerEnvironment: ctx.environment.name,
        isEntry: !!(map[id]?.isEntry || options.isEntry),
      };
      map[id] = meta;
      return `__assets_manifest[${JSON.stringify(options.environment)}][${JSON.stringify(meta.key)}]`;
    }
  }

  return [
    {
      name: "fullstack:assets",
      // TODO: support non shared build?
      sharedDuringBuild: true,
      configureServer(server_) {
        server = server_;
      },
      configResolved(config) {
        resolvedConfig = config;
      },
      configEnvironment(name) {
        const serverEnvironments = pluginOpts?.serverEnvironments ?? ["ssr"];
        if (serverEnvironments.includes(name)) {
          return {
            build: {
              emitAssets: true,
            },
          };
        }
      },
      /**
       * [Transform input]
       *   const assets = import.meta.vite.assets(...)
       *
       * [Transform output]
       *   import __assets_xxx from "virtual:fullstack/assets?..."
       *   const assets = __assets_xxx
       */
      transform: {
        async handler(code, id, _options) {
          if (!code.includes("import.meta.vite.assets")) return;

          const output = new MagicString(code);
          const strippedCode = stripLiteral(code);

          const newImports = new Set<string>();

          for (const match of code.matchAll(
            /import\.meta\.vite\.assets\(([\s\S]*?)\)/dg,
          )) {
            const [start, end] = match.indices![0]!;

            // skip if inside comment or string literal
            if (
              !strippedCode
                .slice(start, end)
                .includes("import.meta.vite.assets")
            ) {
              continue;
            }

            // No-op on client since vite build handles preload/css for dynamic import on client.
            // https://vite.dev/guide/features.html#async-chunk-loading-optimization
            if (this.environment.name === "client") {
              const replacement = `(${JSON.stringify(EMPTY_ASSETS)})`;
              output.update(start, end, replacement);
              continue;
            }

            const argCode = match[1]!.trim();
            const options = {
              import: id,
              environment: undefined,
              asEntry: false,
            } satisfies ImportAssetsOptions;
            if (argCode) {
              const argValue = evalValue<ImportAssetsOptions>(argCode);
              Object.assign(options, argValue);
            }

            // when `environment` is omitted, import both client and
            // current environment (i.e. treat is as universal route)
            const environments = options.environment
              ? [options.environment]
              : ["client", this.environment.name];
            const importedNames: string[] = [];
            for (const environment of environments) {
              const importSource = toAssetsVirtual({
                import: options.import,
                importer: id,
                environment,
                entry: options.asEntry ? "1" : "",
              });
              const hash = hashString(importSource);
              const importedName = `__assets_${hash}`;
              newImports.add(
                `;import ${importedName} from ${JSON.stringify(importSource)};\n`,
              );
              importedNames.push(importedName);
            }
            let replacement = importedNames[0]!;
            if (importedNames.length > 1) {
              newImports.add(
                `;import * as __assets_runtime from "@hiogawa/vite-plugin-fullstack/runtime";\n`,
              );
              replacement = `__assets_runtime.mergeAssets(${importedNames.join(", ")})`;
            }
            output.update(start, end, `(${replacement})`);
          }

          if (output.hasChanged()) {
            // add virtual imports at the end so that other imports are already processed
            // and css already exists in server module graph.
            // TODO: forgot to do this on `@vitejs/plugin-rsc`
            // TODO: nop, we probably want to eagerly transform anyways.
            for (const newImport of newImports) {
              output.append(newImport);
            }
            return {
              code: output.toString(),
              map: output.generateMap({ hires: "boundary" }),
            };
          }
        },
      },
      resolveId: {
        handler(source) {
          if (source.startsWith("virtual:fullstack/assets?")) {
            return "\0" + source;
          }
          if (source === "virtual:fullstack/assets-manifest") {
            assert.notEqual(this.environment.name, "client");
            assert.equal(this.environment.mode, "build");
            return { id: source, external: true };
          }
        },
      },
      load: {
        async handler(id) {
          const parsed = parseAssetsVirtual(id);
          if (!parsed) return;
          assert.notEqual(this.environment.name, "client");

          // TODO: we probably shouldn't resolve client file on other environment.
          // we could avoid this by another virtual but it's possible only for dev.
          const resolved = await this.resolve(parsed.import, parsed.importer);
          assert(resolved, `Failed to resolve: ${parsed.import}`);

          const s = new MagicString("");
          const code = await processAssetsImport(this, resolved.id, {
            environment: parsed.environment,
            isEntry: !!parsed.entry,
          });
          s.append(`export default ${code};\n`);
          if (this.environment.mode === "build") {
            s.prepend(
              `import __assets_manifest from "virtual:fullstack/assets-manifest";\n`,
            );
          }
          return s.toString();
        },
      },
      // non-client builds can load assets manifest as external
      renderChunk(code, chunk) {
        if (code.includes("virtual:fullstack/assets-manifest")) {
          const replacement = normalizeRelativePath(
            path.relative(
              path.join(chunk.fileName, ".."),
              BUILD_ASSETS_MANIFEST_NAME,
            ),
          );
          code = code.replaceAll(
            "virtual:fullstack/assets-manifest",
            () => replacement,
          );
          return { code };
        }
        return;
      },
      writeBundle(_options, bundle) {
        bundleMap[this.environment.name] = bundle;
      },
      buildStart() {
        // dynamically add client entry during build
        if (
          this.environment.mode == "build" &&
          this.environment.name === "client"
        ) {
          const metas = importAssetsMetaMap["client"];
          if (metas) {
            for (const meta of Object.values(importAssetsMetaMap["client"]!)) {
              if (meta.isEntry) {
                this.emitFile({
                  type: "chunk",
                  id: meta.id,
                  preserveSignature: "exports-only",
                });
              }
            }
          }
        }
      },
      buildApp: {
        order: "post",
        async handler(builder) {
          // build manifest of imported assets
          const manifest: BuildAssetsManifest = {};
          const deduplicateCss =
            pluginOpts?.experimental?.deduplicateCss ?? false;

          // Build a mapping from server module IDs to their CSS output files
          // The serverModuleToVirtualCssEntry map is populated in generateBundle with CSS filenames

          for (const [environmentName, metas] of Object.entries(
            importAssetsMetaMap,
          )) {
            const bundle = bundleMap[environmentName]!;
            const assetDepsMap = collectAssetDeps(bundle);
            for (const [id, meta] of Object.entries(metas)) {
              const found = assetDepsMap[id];
              if (!found) {
                return this.error(
                  `[vite-plugin-fullstack] failed to find built chunk for ${meta.id} imported by ${meta.importerEnvironment} environment`,
                );
              }
              const result: ImportAssetsResult = {
                js: [],
                css: [],
              };
              const { chunk, deps } = found;
              // TODO: base
              if (environmentName === "client") {
                result.entry = `/${chunk.fileName}`;
                result.js = deps.js.map((fileName) => ({
                  href: `/${fileName}`,
                }));
              }

              // When CSS deduplication is enabled and this is a server environment,
              // collect CSS from the client build instead
              if (deduplicateCss && environmentName !== "client") {
                const cssFiles = new Set<string>();
                // Collect CSS files from client bundle for this server entry
                // We need to walk the server module graph to find all modules with CSS
                const serverBundle = bundleMap[environmentName]!;
                const serverModuleIds = new Set<string>();

                // Collect all module IDs reachable from this entry
                function collectModules(chunkFileName: string) {
                  const chunk = serverBundle[chunkFileName];
                  if (chunk?.type === "chunk") {
                    for (const moduleId of chunk.moduleIds) {
                      serverModuleIds.add(moduleId);
                    }
                  }
                }
                collectModules(chunk.fileName);

                // For each server module, check if we have a virtual CSS entry for it
                for (const moduleId of serverModuleIds) {
                  const cssFilesStr =
                    cssDeduplicationState.serverModuleToVirtualCssEntry.get(
                      moduleId,
                    );
                  if (cssFilesStr) {
                    // Split comma-separated CSS files and add them
                    const cssFileNames = cssFilesStr.split(",");
                    for (const cssFile of cssFileNames) {
                      if (cssFile) {
                        cssFiles.add(cssFile);
                      }
                    }
                  }
                }

                result.css = [...cssFiles].map((fileName) => ({
                  href: `/${fileName}`,
                }));
              } else if (!deduplicateCss || environmentName === "client") {
                result.css = deps.css.map((fileName) => ({
                  href: `/${fileName}`,
                }));
              }
              (manifest[environmentName] ??= {})[meta.key] = result;
            }
          }

          // write manifest to importer environments
          const importerEnvironments = new Set(
            Object.values(importAssetsMetaMap)
              .flatMap((metas) => Object.values(metas))
              .flatMap((meta) => meta.importerEnvironment),
          );
          for (const environmentName of importerEnvironments) {
            const outDir =
              builder.environments[environmentName]!.config.build.outDir;
            fs.writeFileSync(
              path.join(outDir, BUILD_ASSETS_MANIFEST_NAME),
              `export default ${JSON.stringify(manifest, null, 2)};`,
            );

            // copy assets to client (mainly for server css)
            const clientOutDir =
              builder.environments["client"]!.config.build.outDir;
            for (const asset of Object.values(bundleMap[environmentName]!)) {
              if (asset.type === "asset") {
                const isCssAsset = asset.fileName.endsWith(".css");
                if (
                  deduplicateCss &&
                  isCssAsset &&
                  environmentName !== "client"
                ) {
                  // Skip copying CSS assets from server to client when deduplication is enabled
                  continue;
                }
                const srcFile = path.join(outDir, asset.fileName);
                const destFile = path.join(clientOutDir, asset.fileName);
                fs.mkdirSync(path.dirname(destFile), { recursive: true });
                fs.copyFileSync(srcFile, destFile);
              }
            }
          }
        },
      },
    },
    {
      name: "fullstack:assets-query",
      sharedDuringBuild: true,
      resolveId: {
        order: "pre",
        handler(source) {
          const { query } = parseIdQuery(source);
          const value = query["assets"];
          if (typeof value !== "undefined") {
            if (this.environment.name === "client") {
              return `\0virtual:fullstack/empty-assets`;
            }
          }
        },
      },
      load: {
        async handler(id) {
          if (id === "\0virtual:fullstack/empty-assets") {
            return `export default ${JSON.stringify(EMPTY_ASSETS)}`;
          }
          const { filename, query } = parseIdQuery(id);
          const value = query["assets"];
          if (typeof value !== "undefined") {
            // implement different semantics depending on query
            // assets=client => { environment: "client", isEntry: true }
            // assets=ssr    => { environment: "ssr",    isEntry: false }
            // assets        => { environment: "client", isEntry: false }, { environment: <this>, isEntry: false }
            const s = new MagicString("");
            if (value) {
              const code = await processAssetsImport(this, filename, {
                environment: value,
                isEntry: value === "client",
              });
              s.append(`export default ${code};\n`);
            } else {
              const code1 = await processAssetsImport(this, filename, {
                environment: "client",
                isEntry: false,
              });
              const code2 = await processAssetsImport(this, filename, {
                environment: this.environment.name,
                isEntry: false,
              });
              s.append(
                `import * as __assets_runtime from "@hiogawa/vite-plugin-fullstack/runtime";\n` +
                  `export default __assets_runtime.mergeAssets(${code1}, ${code2});\n`,
              );
            }
            if (this.environment.mode === "build") {
              s.prepend(
                `import __assets_manifest from "virtual:fullstack/assets-manifest";\n`,
              );
            }
            return {
              code: s.toString(),
              moduleSideEffects: false,
            };
          }
        },
      },
      // NOTE:
      // manually invalidate instead of automatic module graph based invalidation via `addWatchFile`.
      // context:
      // - https://github.com/hi-ogawa/vite-plugins/issues/1233
      // - https://github.com/vitejs/vite-plugin-react/pull/847
      hotUpdate(ctx) {
        if (this.environment.name === "rsc") {
          const mods = collectModuleDependents(ctx.modules);
          for (const mod of mods) {
            if (mod.id) {
              const ids = [
                `${mod.id}?assets`,
                `${mod.id}?assets=client`,
                `${mod.id}?assets=${this.environment.name}`,
              ];
              for (const id of ids) {
                invalidteModuleById(this.environment, id);
              }
            }
          }
        }
      },
    },
    // ensure at least one client build input to prevent Vite
    // from looking for index.html and breaking build
    {
      ...createVirtualPlugin("fullstack/client-fallback", () => "export {}"),
      configEnvironment: {
        order: "post",
        handler(name, config, _env) {
          if (name === "client") {
            if (!config.build?.rollupOptions?.input) {
              return {
                build: {
                  rollupOptions: {
                    input: {
                      __fallback: "virtual:fullstack/client-fallback",
                    },
                  },
                },
              };
            }
          }
        },
      },
      generateBundle(_optoins, bundle) {
        if (this.environment.name !== "client") return;
        for (const [k, v] of Object.entries(bundle)) {
          if (v.type === "chunk" && v.name === "__fallback") {
            delete bundle[k];
          }
        }
      },
    },
    {
      name: "fullstack:assets-deduplicate-server-css",
      sharedDuringBuild: true,
      apply: () => pluginOpts?.experimental?.deduplicateCss === true,
      moduleParsed(info) {
        // Track CSS imports from server environments for deduplication
        if (
          this.environment.mode === "build" &&
          this.environment.name !== "client"
        ) {
          // Track which CSS modules are imported by which server modules
          for (const importedId of info.importedIds) {
            if (isCSSRequest(importedId) && !hasSpecialCssQuery(importedId)) {
              if (!cssDeduplicationState.serverModuleToCss.has(info.id)) {
                cssDeduplicationState.serverModuleToCss.set(info.id, new Set());
              }
              cssDeduplicationState.serverModuleToCss
                .get(info.id)!
                .add(importedId);
            }
          }
        }
      },
      resolveId: {
        handler(source) {
          // Handle virtual CSS entry modules for deduplication
          if (source.startsWith("virtual:fullstack/css-entry-")) {
            return "\0" + source;
          }
        },
      },
      load: {
        async handler(id) {
          // Handle virtual CSS entry modules
          if (id.startsWith("\0virtual:fullstack/css-entry-")) {
            const hash = id.slice("\0virtual:fullstack/css-entry-".length);
            const serverModuleId =
              cssDeduplicationState.hashToServerModule.get(hash);
            if (serverModuleId) {
              const cssModules =
                cssDeduplicationState.serverModuleToCss.get(serverModuleId);
              if (cssModules && cssModules.size > 0) {
                // Generate imports for all CSS modules
                const imports = [...cssModules]
                  .map((cssId) => `import ${JSON.stringify(cssId)};`)
                  .join("\n");
                return imports;
              }
            }
            return ""; // Empty module if no CSS
          }
        },
      },
      buildStart() {
        // Add tracked server CSS modules as entries to client build for deduplication
        // Create a virtual module per server module that imports CSS files
        if (
          this.environment.mode === "build" &&
          this.environment.name === "client"
        ) {
          for (const [
            serverModuleId,
            cssModules,
          ] of cssDeduplicationState.serverModuleToCss.entries()) {
            if (cssModules.size > 0) {
              // Create a virtual CSS entry module for this server module
              // Use a hash to create a shorter, stable ID
              const hash = hashString(serverModuleId);
              const virtualId = `virtual:fullstack/css-entry-${hash}`;
              cssDeduplicationState.hashToServerModule.set(
                hash,
                serverModuleId,
              );
              const refId = this.emitFile({
                type: "chunk",
                id: virtualId,
              });
              cssDeduplicationState.serverModuleToVirtualCssEntry.set(
                serverModuleId,
                refId,
              );
            }
          }
        }
      },
      generateBundle(_options, bundle) {
        // After client build, map virtual CSS entry modules to their output CSS filenames
        if (this.environment.name === "client") {
          for (const [
            serverModuleId,
            refId,
          ] of cssDeduplicationState.serverModuleToVirtualCssEntry.entries()) {
            try {
              const chunkFileName = this.getFileName(refId);
              // The chunk is a .js file that imports the actual .css files
              // Get the actual CSS files from the chunk's viteMetadata
              const chunk = bundle[chunkFileName];
              if (chunk && chunk.type === "chunk") {
                const cssFiles = chunk.viteMetadata?.importedCss ?? new Set();
                if (cssFiles.size > 0) {
                  // Store the CSS files for this server module
                  // Update the map to store CSS filenames instead of reference IDs
                  const cssArray = [...cssFiles];
                  cssDeduplicationState.serverModuleToVirtualCssEntry.set(
                    serverModuleId,
                    cssArray.join(","),
                  );
                }
              }
            } catch (e) {
              // Ignore errors for CSS modules that couldn't be mapped
            }
          }
        }
      },
    },
    patchViteClientPlugin(),
    patchVueScopeCssHmr(),
  ];
}

const EMPTY_ASSETS: ImportAssetsResult = {
  js: [],
  css: [],
};

const BUILD_ASSETS_MANIFEST_NAME = "__fullstack_assets_manifest.js";

async function collectCss(
  environment: DevEnvironment,
  entryId: string,
  options: { eager: boolean },
) {
  const visited = new Set<string>();
  const cssIds = new Set<string>();

  async function recurse(id: string) {
    if (
      visited.has(id) ||
      parseAssetsVirtual(id) ||
      "assets" in parseIdQuery(id).query
    ) {
      return;
    }
    visited.add(id);
    const mod = environment.moduleGraph.getModuleById(id);
    if (!mod) return;
    if (options.eager && !mod?.transformResult) {
      try {
        await environment.transformRequest(id);
      } catch (e) {
        console.error(`[collectCss] Failed to transform '${id}'`, e);
      }
    }
    // TODO: should skip dynamic imports? but no such metadata in dev module graph.
    for (const next of mod?.importedModules ?? []) {
      if (next.id) {
        if (isCSSRequest(next.id)) {
          if (hasSpecialCssQuery(next.id)) {
            continue;
          }
          cssIds.add(next.id);
        } else {
          recurse(next.id);
        }
      }
    }
  }

  await recurse(entryId);

  // this doesn't include ?t= query so that RSC <link /> won't keep adding styles.
  const hrefs = [...cssIds].map((id) =>
    normalizeViteImportAnalysisUrl(environment, id),
  );
  return { ids: [...cssIds], hrefs };
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

function hasSpecialCssQuery(id: string): boolean {
  return /[?&](url|inline|raw)(\b|=|&|$)/.test(id);
}

type BuildAssetsManifest = {
  [environment: string]: {
    [import_: string]: ImportAssetsResult;
  };
};

type AssetDeps = {
  js: string[];
  css: string[];
};

type AssetDepsMap = {
  [id: string]: { chunk: Rollup.OutputChunk; deps: AssetDeps };
};

function collectAssetDeps(bundle: Rollup.OutputBundle) {
  const chunkToDeps = new Map<Rollup.OutputChunk, AssetDeps>();
  for (const chunk of Object.values(bundle)) {
    if (chunk.type === "chunk") {
      chunkToDeps.set(chunk, collectAssetDepsInner(chunk.fileName, bundle));
    }
  }
  const idToDeps: AssetDepsMap = {};
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

// TODO: patch @vite/client for https://github.com/vitejs/vite/pull/20767
function patchViteClientPlugin(): Plugin {
  const viteClientPath = normalizePath(
    fileURLToPath(import.meta.resolve("vite/dist/client/client.mjs")),
  );

  function endIndexOf(code: string, searchValue: string) {
    const i = code.lastIndexOf(searchValue);
    return i === -1 ? i : i + searchValue.length;
  }

  return {
    name: "fullstack:patch-vite-client",
    transform: {
      handler(code, id) {
        if (id === viteClientPath) {
          const s = new MagicString(code);
          s.prependLeft(
            code.indexOf("const sheetsMap"),
            `\
const linkSheetsMap = new Map();
document
  .querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]')
  .forEach((el) => {
    linkSheetsMap.set(el.getAttribute('data-vite-dev-id'), el)
  });
`,
          );
          s.appendLeft(
            endIndexOf(code, `function updateStyle(id, content) {`),
            `if (linkSheetsMap.has(id)) { return }`,
          );
          s.appendLeft(
            endIndexOf(code, `function removeStyle(id) {`),
            `
const link = linkSheetsMap.get(id);
if (link) {
  document
    .querySelectorAll(
      'link[rel="stylesheet"][data-vite-dev-id]',
    )
    .forEach((el) => {
      if (el.getAttribute('data-vite-dev-id') === id) {
        el.remove()
      }
    })
  linkSheetsMap.delete(id)
}
`,
          );
          return s.toString();
        }
      },
    },
  };
}

// TODO: upstream?
// Vite client HMR requests scoped css link stylesheet with `lang.css=` instead of `lang.css`,
// which seems to cause response to be `content-type: text/javascript` even though response text is raw css.
// This middleware rewrites url so that Vite will add `text/css`.
function patchVueScopeCssHmr(): Plugin {
  return {
    name: "fullstack:patch-vue-scoped-css-hmr",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (
          req.headers.accept?.includes("text/css") &&
          req.url?.includes("&lang.css=")
        ) {
          req.url = req.url.replace("&lang.css=", "?lang.css");
        }
        next();
      });
    },
  };
}
