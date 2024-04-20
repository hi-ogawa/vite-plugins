import { createDebug, tinyassert } from "@hiogawa/utils";
import MagicString from "magic-string";
import { type Plugin, parseAstAsync } from "vite";
import type { ReactServerManager } from "../../plugin";
import { USE_SERVER_RE, getExportNames } from "../../plugin/ast-utils";
import { hashString } from "../../plugin/utils";

const debug = createDebug("react-server:plugin:server-action");

/*
transform "use server" directive on client

[input]
"use server"
export function hello() {}

[output] (client / ssr)
import { createServerReference } from "...runtime..."
export const hello = createServerReference("<id>#hello");
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
      if (!code.match(USE_SERVER_RE)) {
        return;
      }
      const ast = await parseAstAsync(code);
      const exportNames = getExportNames(ast);
      debug(`[${vitePluginClientUseServer.name}:transform]`, {
        id,
        exportNames,
      });
      // validate server reference used by client is properly generated in rsc build
      if (manager.buildType === "client") {
        tinyassert(
          manager.rscUseServerIds.has(id),
          `missing server references in RSC build: ${id}`,
        );
      }
      // obfuscate reference
      if (manager.buildType) {
        id = hashString(id);
      }
      let result = `import { createServerReference as $$create } from "${options?.ssr ? ssrRuntimePath : runtimePath}";\n`;
      for (const name of exportNames) {
        if (name === "default") {
          result += `const $$default = $$create("${id}#${name}");\n`;
          result += `export default $$default;\n`;
        } else {
          result += `export const ${name} = $$create("${id}#${name}");\n`;
        }
      }
      return result;
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
import { registerServerReference } from "...runtime..."
hello = createServerReference(hello, "<id>", "hello");
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
      if (!code.match(USE_SERVER_RE)) {
        return;
      }
      // cf. https://github.com/hi-ogawa/vite-plugins/blob/5f8e6936fa12e1f7524891e3c1e2a21065d50250/packages/vite-plugin-simple-hmr/src/transform.ts#L73
      const ast = await parseAstAsync(code);
      const mcode = new MagicString(code);
      const exportNames = getExportNames(ast, { toWritable: { code: mcode } });
      mcode.prepend(
        `import { registerServerReference as $$register } from "${runtimePath}";\n`,
      );
      // obfuscate reference
      if (manager.buildType) {
        id = hashString(id);
      }
      for (const name of exportNames) {
        mcode.append(`${name} = $$register(${name}, "${id}", "${name}");\n`);
      }
      const outCode = mcode.toString();
      debug(`[${vitePluginServerUseServer.name}:transform]`, {
        id,
        exportNames,
        outCode,
      });
      return {
        code: outCode,
        map: mcode.generateMap(),
      };
    },
  };
}
