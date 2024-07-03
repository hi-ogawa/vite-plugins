import {
  transformDirectiveProxyExport,
  transformServerActionServer,
} from "@hiogawa/transforms";
import { createDebug, tinyassert } from "@hiogawa/utils";
import { type Plugin, type PluginOption, parseAstAsync } from "vite";
import type { PluginStateManager } from "../../plugin";
import {
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
      if (manager.buildType && !manager.useServerIds.has(id)) {
        throw new Error(
          `client imported undiscovered server reference '${id}'`,
        );
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
}): PluginOption {
  const transformPlugin: Plugin = {
    name: vitePluginServerUseServer.name,
    async transform(code, id, _options) {
      manager.useServerIds.delete(id);
      if (!code.includes(USE_SERVER)) {
        return;
      }
      const ast = await parseAstAsync(code);
      const { output } = await transformServerActionServer(code, ast, {
        id: manager.buildType ? hashString(id) : id,
        runtime: "$$register",
      });
      if (output.hasChanged()) {
        manager.useServerIds.add(id);
        output.prepend(
          `import { registerServerReference as $$register } from "${runtimePath}";\n`,
        );
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
    if (manager.buildType === "scan") {
      return `export default {}`;
    }
    tinyassert(manager.buildType === "server");
    let result = `export default {\n`;
    for (const id of manager.useServerIds) {
      result += `"${hashString(id)}": () => import("${id}"),\n`;
    }
    result += "};\n";
    debug("[virtual:server-references]", result);
    return result;
  });

  return [transformPlugin, virtualPlugin];
}
