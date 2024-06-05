import {
  transformDirectiveProxyExport,
  transformServerActionServer,
} from "@hiogawa/transforms";
import {
  createDebug,
  createManualPromise,
  debounce,
  tinyassert,
} from "@hiogawa/utils";
import { type Plugin, parseAstAsync } from "vite";
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
      if (manager.buildType === "parallel") {
        tinyassert(manager.buildContextServer);
        manager.buildContextServer.emitFile({
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
}): Plugin[] {
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
        if (manager.buildType) {
          this.emitFile({
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
  };

  // expose server references for RSC build via virtual module
  const virtualPlugin = createVirtualPlugin("server-references", async () => {
    // if (manager.buildType === "scan") {
    //   return `export default {}`;
    // }
    tinyassert(manager.buildType === "parallel");
    tinyassert(manager.buildContextServer);
    await manager.buildContextServer.load({ id: "\0virtual:wait-for-idle" });
    console.log("[virtual:server-references]", manager.rscUseServerIds);
    let result = `export default {\n`;
    for (const id of manager.rscUseServerIds) {
      result += `"${hashString(id)}": () => import("${id}"),\n`;
    }
    result += "};\n";
    debug("[virtual:server-references]", result);
    return result;
  });

  return [transformPlugin, virtualPlugin, ...waitForIdlePlugin()];
}

// https://github.com/rollup/rollup/issues/4985#issuecomment-1936333388
// https://github.com/ArnaudBarre/downwind/blob/1d47b6a3f1e7bc271d0bb5bd96cfbbea68445510/src/vitePlugin.ts#L164
export function waitForIdlePlugin(): Plugin[] {
  const idlePromise = createManualPromise<void>();
  let done = false;
  const notIdle = debounce((...args) => {
    if (0) {
      if (done) {
        console.log("[wait-for-idle:done-again]");
      }
      console.log("[wait-for-idle:done]", { args });
    }
    done = true;
    idlePromise.resolve();
  }, 200);

  return [
    {
      name: waitForIdlePlugin.name,
      apply: "build",
      enforce: "pre",
      buildStart() {
        this.emitFile({
          type: "chunk",
          id: "virtual:wait-for-idle",
        });
      },
      resolveId: notIdle,
      load: notIdle,
      transform: notIdle,
    },
    createVirtualPlugin("wait-for-idle", async () => {
      await idlePromise;
      return `export default "** wait-for-idle **"`;
    }),
  ];
}
