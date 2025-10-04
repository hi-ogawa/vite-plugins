import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MagicString from "magic-string";
import { toNodeHandler } from "srvx/node";
import {
  DevEnvironment,
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
  type AssetsVirtual,
  parseAssetsVirtual,
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
};

type ImportAssetsMeta = {
  id: string;
  key: string;
  importerEnvironment: string;
  virtual: AssetsVirtual;
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

          // TODO: strip comments
          const output = new MagicString(code);

          const emptyResult: ImportAssetsResult = {
            js: [],
            css: [],
          };

          const newImports = new Set<string>();

          for (const match of code.matchAll(
            /import\.meta\.vite\.assets\(([\s\S]*?)\)/dg,
          )) {
            const [start, end] = match.indices![0]!;

            // No-op on client since vite build handles preload/css for dynamic import on client.
            // https://vite.dev/guide/features.html#async-chunk-loading-optimization
            if (this.environment.name === "client") {
              const replacement = `(${JSON.stringify(emptyResult)})`;
              output.update(start, end, replacement);
              continue;
            }

            const argCode = match[1]!.trim();
            const options: Required<ImportAssetsOptions> = {
              import: id,
              environment: this.environment.name,
              asEntry: false,
            };
            if (argCode) {
              const argValue = evalValue<ImportAssetsOptions>(argCode);
              Object.assign(options, argValue);
            }

            const importSource = toAssetsVirtual({
              import: options.import,
              importer: id,
              environment: options.environment,
              entry: options.asEntry ? "1" : "",
            });
            const hash = hashString(importSource);
            const importedName = `__assets_${hash}`;
            newImports.add(
              `;import ${importedName} from ${JSON.stringify(importSource)};\n`,
            );
            output.update(start, end, `(${importedName})`);
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

          if (this.environment.mode === "dev") {
            const result: ImportAssetsResult = {
              entry: undefined, // defined only on client
              js: [], // always empty
              css: [], // defined only on server
            };
            const environment = server.environments[parsed.environment];
            assert(environment, `Unknown environment: ${parsed.environment}`);
            if (parsed.environment === "client") {
              result.entry = normalizeViteImportAnalysisUrl(
                environment,
                resolved.id,
              );
            }
            if (environment.name !== "client") {
              const collected = await collectCss(environment, resolved.id);
              for (const file of [resolved.id, ...collected.visitedFiles]) {
                if (fs.existsSync(file)) {
                  this.addWatchFile(file);
                }
              }
              result.css = collected.hrefs.map((href, i) => ({
                href,
                "data-vite-dev-id": collected.ids[i],
              }));
            }
            return `export default ${JSON.stringify(result)}`;
          } else {
            const meta: ImportAssetsMeta = {
              id: resolved.id,
              // normalize to have machine-independent build output
              key: path.relative(resolvedConfig.root, resolved.id),
              importerEnvironment: this.environment.name,
              virtual: parsed,
            };
            // TODO: don't overwrite entry=true to entry=false
            (importAssetsMetaMap[parsed.environment] ??= {})[meta.id] = meta;
            return `\
              import __assets_manifest from "virtual:fullstack/assets-manifest";
              export default __assets_manifest[${JSON.stringify(parsed.environment)}][${JSON.stringify(meta.key)}];
            `;
          }
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
              if (meta.virtual.entry) {
                this.emitFile({
                  type: "chunk",
                  id: meta.id,
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
              result.css = deps.css.map((fileName) => ({
                href: `/${fileName}`,
              }));
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
    patchViteClientPlugin(),
    patchVueScopeCssHmr(),
  ];
}

const BUILD_ASSETS_MANIFEST_NAME = "__fullstack_assets_manifest.js";

async function collectCss(environment: DevEnvironment, entryId: string) {
  const visited = new Set<string>();
  const cssIds = new Set<string>();
  const visitedFiles = new Set<string>();

  async function recurse(id: string) {
    if (visited.has(id) || parseAssetsVirtual(id)) {
      return;
    }
    visited.add(id);
    const mod = environment.moduleGraph.getModuleById(id);
    if (!mod) return;
    // TODO: this is not ideal.
    // We eagerly transforming module is required
    // to allow patterns like packages/fullstack/examples/react-router/src/routes.ts
    if (!mod.transformResult) {
      try {
        await environment.transformRequest(id);
      } catch (e) {
        console.error(`[collectCss] Failed to transform '${id}'`, e);
      }
    }
    if (mod?.file) {
      visitedFiles.add(mod.file);
    }
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
  return { ids: [...cssIds], hrefs, visitedFiles: [...visitedFiles] };
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
