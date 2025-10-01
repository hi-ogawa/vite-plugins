import assert from "node:assert";
import { createHash } from "node:crypto";
import MagicString from "magic-string";
import { toNodeHandler } from "srvx/node";
import {
  type Plugin,
  type ResolvedConfig,
  isRunnableDevEnvironment,
} from "vite";
import type { ImportAssetsOptions, ImportAssetsResult } from "../types/shared";

type FullstackPluginOptions = {
  serverHandler?: boolean;
};

export default function vitePluginFullstack(
  customOptions?: FullstackPluginOptions,
): Plugin[] {
  customOptions;
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
      configureServer(server) {
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
      transform: {
        async handler(code, id, _options) {
          if (!code.includes("import.meta.vite.assets")) return;

          const output = new MagicString(code);
          // let importAdded = false;

          for (const match of code.matchAll(
            /import\.meta\.vite\.assets\(([\s\S]*?)\)/dg,
          )) {
            const [start, end] = match.indices![0]!;
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

            // const importId = toCssVirtual({ id: importer, type: "rsc" });

            // // use dynamic import during dev to delay crawling and discover css correctly.
            // let replacement: string;
            // if (this.environment.mode === "dev") {
            //   replacement = `__vite_rsc_react__.createElement(async () => {
            //     const __m = await import(${JSON.stringify(importId)});
            //     return __vite_rsc_react__.createElement(__m.Resources);
            //   })`;
            // } else {
            //   const hash = hashString(importId);
            //   if (
            //     !importAdded &&
            //     !code.includes(`__vite_rsc_importer_resources_${hash}`)
            //   ) {
            //     importAdded = true;
            //     output.prepend(
            //       `import * as __vite_rsc_importer_resources_${hash} from ${JSON.stringify(
            //         importId,
            //       )};`,
            //     );
            //   }
            //   replacement = `__vite_rsc_react__.createElement(__vite_rsc_importer_resources_${hash}.Resources)`;
            // }

            const result: ImportAssetsResult = {
              entry: undefined,
              js: [],
              css: [],
            };
            const replacement = `(${JSON.stringify(result)})`;
            output.update(start, end, replacement);
          }

          if (output.hasChanged()) {
            // if (!code.includes("__vite_rsc_react__")) {
            //   output.prepend(`import __vite_rsc_react__ from "react";`);
            // }
            return {
              code: output.toString(),
              map: output.generateMap({ hires: "boundary" }),
            };
          }
        },
      },
      load: {
        async handler(id) {
          id;
          // const { server } = manager;
          // const parsed = parseCssVirtual(id);
          // if (parsed?.type === "rsc") {
          //   assert(this.environment.name === "rsc");
          //   const importer = parsed.id;
          //   if (this.environment.mode === "dev") {
          //     const result = collectCss(server.environments.rsc!, importer);
          //     for (const file of [importer, ...result.visitedFiles]) {
          //       this.addWatchFile(file);
          //     }
          //     const cssHrefs = result.hrefs.map((href) => href.slice(1));
          //     const deps = assetsURLOfDeps({ css: cssHrefs, js: [] }, manager);
          //     return generateResourcesCode(
          //       serializeValueWithRuntime(deps),
          //       manager,
          //     );
          //   } else {
          //     const key = manager.toRelativeId(importer);
          //     manager.serverResourcesMetaMap[importer] = { key };
          //     return `
          //     import __vite_rsc_assets_manifest__ from "virtual:vite-rsc/assets-manifest";
          //     ${generateResourcesCode(
          //       `__vite_rsc_assets_manifest__.serverResources[${JSON.stringify(
          //         key,
          //       )}]`,
          //       manager,
          //     )}
          //   `;
          //   }
          // }
        },
      },
    },
  ];
}

function getEntrySource(
  config: Pick<ResolvedConfig, "build">,
  name: string = "index",
): string {
  const input = config.build.rollupOptions.input;
  if (typeof input === "string") {
    return input;
  }
  assert(
    typeof input === "object" &&
      !Array.isArray(input) &&
      name in input &&
      typeof input[name] === "string",
    `[vite-rsc:getEntrySource] expected 'build.rollupOptions.input' to be an object with a '${name}' property that is a string, but got ${JSON.stringify(input)}`,
  );
  return input[name];
}

// https://github.com/vitejs/vite/blob/ea9aed7ebcb7f4be542bd2a384cbcb5a1e7b31bd/packages/vite/src/node/utils.ts#L1469-L1475
function evalValue<T = any>(rawValue: string): T {
  const fn = new Function(`
    var console, exports, global, module, process, require
    return (\n${rawValue}\n)
  `);
  return fn();
}

hashString;
function hashString(v: string): string {
  return createHash("sha256").update(v).digest().toString("hex").slice(0, 12);
}
