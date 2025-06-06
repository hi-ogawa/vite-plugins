import {
  transformDirectiveProxyExport,
  transformServerActionServer,
} from "@hiogawa/transforms";
import { createDebug, tinyassert } from "@hiogawa/utils";
import { type Plugin, parseAstAsync } from "vite";
import type { PluginStateManager } from "../../plugin";
import {
  USE_SERVER,
  applyPluginToClient,
  applyPluginToServer,
  createVirtualPlugin,
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
    applyToEnvironment: applyPluginToClient,
    async transform(code, id, options) {
      if (!code.includes(USE_SERVER)) {
        manager.serverReferenceMap.delete(id);
        return;
      }
      const serverId = manager.normalizeReferenceId(id);
      const ast = await parseAstAsync(code);
      const result = transformDirectiveProxyExport(ast, {
        directive: USE_SERVER,
        code,
        runtime: (name) =>
          `$$ReactClient.createServerReference(` +
          `${JSON.stringify(serverId + "#" + name)}, ` +
          `$$ReactClient.callServer, ` +
          `undefined, ` +
          `$$ReactClient.findSourceMapURL, ` +
          `${JSON.stringify(name)})`,
        ignoreExportAllDeclaration: true,
        rejectNonAsyncFunction: true,
      });
      const output = result?.output;
      if (!output) {
        manager.serverReferenceMap.delete(id);
        return;
      }
      // during client build, all server references are expected to be discovered beforehand.
      if (manager.buildType && !manager.serverReferenceMap.has(id)) {
        throw new Error(
          `client imported undiscovered server reference '${id}'`,
        );
      }
      manager.serverReferenceMap.set(id, serverId);
      const importPath = options?.ssr ? ssrRuntimePath : runtimePath;
      output.prepend(`import * as $$ReactClient from "${importPath}";\n`);
      debug(`[${vitePluginClientUseServer.name}:transform]`, {
        id,
        outCode: output.toString(),
      });
      return { code: output.toString(), map: output.generateMap() };
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
    applyToEnvironment: applyPluginToServer,
    async transform(code, id, _options) {
      manager.serverReferenceMap.delete(id);
      if (!code.includes(USE_SERVER)) {
        return;
      }
      const serverId = manager.normalizeReferenceId(id);
      const ast = await parseAstAsync(code);
      const { output } = transformServerActionServer(code, ast, {
        runtime: (value, name) =>
          `$$ReactServer.registerServerReference(${value}, ${JSON.stringify(serverId)}, ${JSON.stringify(name)})`,
        rejectNonAsyncFunction: true,
        // TODO: encryption
        encode: (value) => value,
        decode: (value) => value,
      });
      if (output.hasChanged()) {
        manager.serverReferenceMap.set(id, serverId);
        output.prepend(`import * as $$ReactServer from "${runtimePath}";\n`);
        debug(`[${vitePluginServerUseServer.name}:transform]`, {
          id,
          outCode: output.toString(),
        });
        return { code: output.toString(), map: output.generateMap() };
      }
      return;
    },
  };

  // expose server references for RSC build via virtual module
  const virtualPlugin = createVirtualPlugin("server-references", async () => {
    if (!manager.buildType || manager.buildType === "scan") {
      return `export default {}`;
    }
    tinyassert(manager.buildType === "server");
    let result = `export default {\n`;
    for (const [id, serverId] of manager.serverReferenceMap) {
      result += `"${serverId}": () => import("${id}"),\n`;
    }
    result += "};\n";
    debug("[virtual:server-references]", result);
    return result;
  });

  return [transformPlugin, virtualPlugin];
}
