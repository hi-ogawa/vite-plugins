import {
  transformDirectiveProxyExport,
  transformServerActionServer,
} from "@hiogawa/transforms";
import { createDebug, sleep, tinyassert } from "@hiogawa/utils";
import { type Plugin, type PluginOption, parseAstAsync } from "vite";
import type { PluginStateManager } from "../../plugin";
import {
  type CustomModuleMeta,
  USE_SERVER,
  createVirtualPlugin,
  hashString,
} from "../../plugin/utils";

const debug = createDebug("react-server:plugin:server-action");

/*
transform "use server" directive on client (browser / ssr)

[input]
"use server"
export function hello() {}

[output]
export const hello = $$proxy("<id>", "hello");
*/
export function vitePluginClientUseServer({
  manager,
  runtimePath,
  ssrRuntimePath,
}: {
  manager: PluginStateManager;
  runtimePath: string;
  ssrRuntimePath: string;
}): Plugin {
  return {
    name: vitePluginClientUseServer.name,
    async transform(code, id, options) {
      if (!code.includes(USE_SERVER)) {
        return;
      }
      const ast = await parseAstAsync(code);
      const output = await transformDirectiveProxyExport(ast, {
        directive: USE_SERVER,
        id: manager.buildType ? hashString(id) : id,
        runtime: "$$proxy",
      });
      if (!output) {
        return;
      }
      const importPath = options?.ssr ? ssrRuntimePath : runtimePath;
      output.prepend(`\
import { createServerReference } from "${importPath}";
const $$proxy = (id, name) => createServerReference(id + "#" + name);
`);
      debug(`[${vitePluginClientUseServer.name}:transform]`, {
        id,
        outCode: output.toString(),
      });
      return {
        code: output.toString(),
        map: output.generateMap(),
        meta: {
          $$rsc: {
            type: "server",
          },
        } satisfies CustomModuleMeta,
      };
    },
  };
}

/*
transform "use server" directive on react-server

[input]
"use server"
export function hello() { ... }

[output]
export function hello() { ... }
hello = $$register(hello, "<id>", "hello");
*/
export function vitePluginServerUseServer({
  manager,
  runtimePath,
}: {
  manager: PluginStateManager;
  runtimePath: string;
}): PluginOption {
  const transformPlugin: Plugin = {
    name: vitePluginServerUseServer.name,
    async transform(code, id, _options) {
      manager.rscUseServerIds.delete(id);
      if (!code.includes(USE_SERVER)) {
        return;
      }
      const ast = await parseAstAsync(code);
      const { output } = await transformServerActionServer(code, ast, {
        id: manager.buildType ? hashString(id) : id,
        runtime: "$$register",
      });
      if (output.hasChanged()) {
        manager.rscUseServerIds.add(id);
        output.prepend(
          `import { registerServerReference as $$register } from "${runtimePath}";\n`,
        );
        debug(`[${vitePluginServerUseServer.name}:transform]`, {
          id,
          outCode: output.toString(),
        });
        if (manager.buildType === "rsc") {
          manager.serverReferenceMap[id] = this.emitFile({
            type: "chunk",
            id,
          });
        }
        return {
          code: output.toString(),
          map: output.generateMap(),
          meta: {
            $$rsc: {
              type: "server",
            },
          } satisfies CustomModuleMeta,
        };
      }
      return;
    },
    generateBundle(_options, bundle) {
      if (manager.buildType === "rsc") {
        let result = `export default {\n`;
        for (const [id, refId] of Object.entries(manager.serverReferenceMap)) {
          const fileName = this.getFileName(refId);
          result += `  "${hashString(id)}": () => import("../${fileName}"),\n`;
        }
        result += "};\n";
        for (const [_k, v] of Object.entries(bundle)) {
          if (
            v.type === "chunk" &&
            v.facadeModuleId === "\0virtual:server-references"
          ) {
            // TODO: how to content hash?
            // server reference virtual is fine, but it's critical for client reference
            v.code = result;
          }
        }
      }
    },
  };

  // expose server references for RSC build via virtual module
  const virtualPlugin = createVirtualPlugin("server-references", async () => {
    if (manager.buildType === "scan") {
      return `export default {}`;
    }
    tinyassert(manager.buildType === "rsc");
    // need to have fake timer to avoid this error?
    //   Error: Unexpected early exit. This happens when Promises returned by plugins cannot resolve. Unfinished hook action(s) on exit
    const fakeTimeout = setTimeout(() => {}, 1e8);
    // await manager.deferServerBuild;
    clearTimeout(fakeTimeout);
    if (1) {
      return `export default "** PLACEHOLDER **"`;
    }
    let result = `export default {\n`;
    for (const id of manager.rscUseServerIds) {
      let key = manager.buildType ? hashString(id) : id;
      result += `"${key}": () => import("${id}"),\n`;
    }
    result += "};\n";
    debug("[virtual:server-references]", result);
    return result;
  });

  return [
    transformPlugin,
    virtualPlugin,
    // https://github.com/rollup/rollup/issues/4985#issuecomment-1936333388
    // https://github.com/ArnaudBarre/downwind/blob/1d47b6a3f1e7bc271d0bb5bd96cfbbea68445510/src/vitePlugin.ts#L164
    {
      name: "wip",
      apply: () => manager.buildType === "rsc",
      enforce: "pre",
      buildStart() {
        this.emitFile({
          type: "chunk",
          id: "virtual:wip-defer",
        });
      },
    },

    // getModuleIds + load approach not working
    // (it still needs some timeout between loop to `getModuleIds` to fill up new ids)
    createVirtualPlugin("wip-defer", async function () {
      await sleep(100);
      {
        // https://github.com/vitejs/vite/issues/6011#issuecomment-1229390631
        const seen = new Set<string>();
        seen.add("\0virtual:wip-defer");
        let modulesToWait = [];
        do {
          console.log("!!!!!!!! loop");
          modulesToWait = [];
          for (const id of this.getModuleIds()) {
            if (seen.has(id)) continue;
            console.log("[id]", id);
            seen.add(id);
            // if (id.startsWith('\0')) continue
            // const info = this.getModuleInfo(id)
            // if (info?.isExternal) continue
            modulesToWait.push(this.load({ id }).catch(() => {}));
          }
          // TODO: timeout if too long
          await Promise.all(modulesToWait);
        } while (modulesToWait.length > 0);
      }

      // {
      //   // https://github.com/rollup/rollup/issues/4294#issuecomment-990633777
      //   const loadedIds = new Set<string>(["\0virtual:wip-defer"]);
      //   while (true) {
      //     console.log("[delayLoad] before = ", loadedIds.size);
      //     let done = true;
      //     const ids = this.getModuleIds();
      //     console.log({ ids });
      //     for (const id of ids) {
      //       if (!loadedIds.has(id)) {
      //         loadedIds.add(id);
      //         done = false;
      //         console.log("[load]", { id });
      //         await this.load({ id });
      //       }
      //     }
      //     console.log("[delayLoad] after = ", loadedIds.size);
      //     if (done) {
      //       break;
      //     }
      //   }
      // }
      return `export default "** defer!! **"`;
    }),
  ];
}
