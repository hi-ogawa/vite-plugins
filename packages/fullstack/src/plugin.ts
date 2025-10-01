import assert from "node:assert";
import MagicString from "magic-string";
import { toNodeHandler } from "srvx/node";
import {
  DevEnvironment,
  type Plugin,
  type ViteDevServer,
  isCSSRequest,
  isRunnableDevEnvironment,
} from "vite";
import type { ImportAssetsOptions, ImportAssetsResult } from "../types/shared";
import { parseAssetsVirtual, toAssetsVirtual } from "./plugins/shared";
import { getEntrySource, hashString } from "./plugins/utils";
import {
  evalValue,
  normalizeViteImportAnalysisUrl,
} from "./plugins/vite-utils";

// TODO: split plugins?
// - assets
// - server handler
type FullstackPluginOptions = {
  serverHandler?: boolean;
};

export default function vitePluginFullstack(
  customOptions?: FullstackPluginOptions,
): Plugin[] {
  customOptions;
  let server: ViteDevServer;

  return [
    {
      name: "fullstack",
      config(userConfig, env) {
        return {
          appType: userConfig.appType ?? "custom",
          define: {
            "import.meta.env.BUILD": JSON.stringify(env.command === "build"),
          },
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
        },
      },
      load: {
        async handler(id) {
          const parsed = parseAssetsVirtual(id);
          if (!parsed) return;

          // TODO: shouldn't resolve in different environment?
          // we can avoid this by another virtual but it's possible only for dev?
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
              // TODO: handle data-vite-dev-id
              result.css = collected.hrefs.map((href) => ({ href }));
            }
            return `export default ${JSON.stringify(result)}`;
          } else {
            // TODO: build
            resolved.id;
          }
        },
      },
    },
    patchViteClientPlugin(),
  ];
}

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
