import {
  transformDirectiveProxyExport,
  transformServerActionServer,
} from "@hiogawa/transforms";
import { createDebug } from "@hiogawa/utils";
import { type Plugin, parseAstAsync } from "vite";
import type { ReactServerManager } from "../../plugin";
import { hashString } from "../../plugin/utils";

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
  manager: ReactServerManager;
  runtimePath: string;
  ssrRuntimePath: string;
}): Plugin {
  return {
    name: vitePluginClientUseServer.name,
    async transform(code, id, options) {
      if (!code.includes("use server")) {
        return;
      }
      const ast = await parseAstAsync(code);
      const output = await transformDirectiveProxyExport(ast, {
        directive: "use server",
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
  manager: ReactServerManager;
  runtimePath: string;
}): Plugin {
  return {
    name: vitePluginServerUseServer.name,
    async transform(code, id, _options) {
      manager.rscUseServerIds.delete(id);
      if (!code.includes("use server")) {
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
        return { code: output.toString(), map: output.generateMap() };
      }
      return;
    },
  };
}
