import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
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
} from "vite";
import type { ImportAssetsOptions, ImportAssetsResult } from "../types/shared";
import { parseAssetsVirtual, toAssetsVirtual } from "./plugins/shared";
import {
  getEntrySource,
  hashString,
  normalizeRelativePath,
} from "./plugins/utils";
import {
  evalValue,
  normalizeViteImportAnalysisUrl,
} from "./plugins/vite-utils";

// TODO: split plugins?
// - serverAssetsPlugin
// - serverHandlerPlugin
type FullstackPluginOptions = {
  serverHandler?: boolean;
};

type ImportAssetsMeta = {
  id: string;
  key: string;
  importerEnvironment: string;
};

export default function vitePluginFullstack(
  customOptions?: FullstackPluginOptions,
): Plugin[] {
  let server: ViteDevServer;
  let resolvedConfig: ResolvedConfig;
  // build metadata
  const importAssetsMetaMap: {
    [environment: string]: { [id: string]: ImportAssetsMeta };
  } = {};
  const bundleMap: { [environment: string]: Rollup.OutputBundle } = {};

  return [
    {
      name: "fullstack:server-handler",
      config(userConfig, _env) {
        return {
          appType: userConfig.appType ?? "custom",
          // define: {
          //   "import.meta.env.BUILD": JSON.stringify(env.command === "build"),
          // },
        };
      },
      configureServer(server_) {
        server = server_;
        if (customOptions?.serverHandler === false) return;
        assert(isRunnableDevEnvironment(server.environments.ssr));
        const environment = server.environments.ssr;
        const runner = environment.runner;
        return () => {
          server.middlewares.use(async (req, res, next) => {
            try {
              const source = getEntrySource(environment.config);
              const mod = await runner.import(source);
              await toNodeHandler(mod.default.fetch)(req, res);
            } catch (e) {
              next(e);
            }
          });
        };
      },
    },
    {
      name: "fullstack:assets",
      // TODO: support non shared build?
      sharedDuringBuild: true,
      configResolved(config) {
        resolvedConfig = config;
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
            };
            if (argCode) {
              const argValue = evalValue<ImportAssetsOptions>(argCode);
              if (argValue.import) {
                options.import = argValue.import;
              }
              if (argValue.environment) {
                options.environment = argValue.environment;
              }
            }

            const importSource = toAssetsVirtual({
              import: options.import,
              importer: id,
              environment: options.environment,
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

          // TODO: shouldn't resolve client file on other environment?
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
              const collected = collectCss(environment, resolved.id);
              for (const file of [resolved.id, ...collected.visitedFiles]) {
                this.addWatchFile(file);
              }
              // TODO: add data-vite-dev-id
              result.css = collected.hrefs.map((href) => ({ href }));
            }
            return `export default ${JSON.stringify(result)}`;
          } else {
            const meta: ImportAssetsMeta = {
              id: resolved.id,
              // normalize to have machine-independent build output
              key: path.relative(resolvedConfig.root, resolved.id),
              importerEnvironment: this.environment.name,
            };
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
                this.error(
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
    patchViteClientPlugin(),
  ];
}

const BUILD_ASSETS_MANIFEST_NAME = "__fullstack_assets_manifest.js";

// TODO: Test this idea https://github.com/vitejs/vite/pull/20767
function patchViteClientPlugin(): Plugin {
  return {
    name: "fullstack:patch-vite-client",
  };
}

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

  recurse(entryId);

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
