import fs from "node:fs";
import nodePath from "node:path";
import { createDebug, memoize, tinyassert } from "@hiogawa/utils";
import { type Plugin, type PluginOption, parseAstAsync } from "vite";
import type { ReactServerManager } from "../../plugin";
import { USE_CLIENT_RE, getExportNames } from "../../plugin/ast-utils";
import { hashString } from "../../plugin/utils";

const debug = createDebug("react-server:plugin:use-client");

/*
transform "use client" directive on react server code

[input]
"use client"
export function Counter() {}

[output] (react-server)
import { registerClientReference as $$register } from "...runtime..."
export const Counter = $$register("<id>", "Counter");
*/
export function vitePluginServerUseClient({
  manager,
  runtimePath,
}: {
  manager: ReactServerManager;
  runtimePath: string;
}): PluginOption {
  // intercept Vite's node resolve to virtualize "use client" in node_modules
  const pluginUseClientNodeModules: Plugin = {
    name: "server-virtual-use-client-node-modules",
    enforce: "pre", // "pre" to steal Vite's node resolve
    apply: "serve",
    resolveId: memoize(async function (this, source, importer) {
      if (
        source[0] !== "." &&
        source[0] !== "/" &&
        !source.startsWith("virtual") &&
        !source.startsWith("\0virtual")
      ) {
        const resolved = await this.resolve(source, importer, {
          skipSelf: true,
        });
        debug("[rsc.use-client-node-modules.resolveId]", {
          source,
          resolved,
        });
        if (resolved && resolved.id.includes("/node_modules/")) {
          const [id] = resolved.id.split("?v=");
          tinyassert(id);
          const code = await fs.promises.readFile(id!, "utf-8");
          if (code.match(USE_CLIENT_RE)) {
            manager.nodeModules.useClient.set(source, {
              id,
              exportNames: new Set(),
            });
            return `\0${VIRTUAL_PREFIX}${source}`;
          }
        }
        return;
      }
      return;
    } satisfies Plugin["resolveId"]),
    async load(id, _options) {
      if (id.startsWith(`\0${VIRTUAL_PREFIX}`)) {
        const source = id.slice(`\0${VIRTUAL_PREFIX}`.length);
        const meta = manager.nodeModules.useClient.get(source);
        tinyassert(meta);
        // node_modules is already transpiled so we can parse it right away
        const code = await fs.promises.readFile(meta.id, "utf-8");
        const ast = await parseAstAsync(code);
        const exportNames = getExportNames(ast);
        meta.exportNames = exportNames;
        // we need to transform to client reference directly
        // otherwise `soruce` will be resolved infinitely by recursion
        id = noramlizeClientReferenceId(id);
        const result = generateClientReferenceCode(
          id,
          exportNames,
          runtimePath,
        );
        debug("[rsc.use-client-node-modules.load]", {
          source,
          meta,
          id,
          result,
        });
        return result;
      }
      return;
    },
  };

  const pluginUseClientLocal: Plugin = {
    name: "use-client-local",
    async transform(code, id, _options) {
      manager.rscIds.add(id);
      manager.rscUseClientIds.delete(id);
      if (!code.match(USE_CLIENT_RE)) {
        return;
      }
      const ast = await parseAstAsync(code);
      const exportNames = getExportNames(ast);
      manager.rscUseClientIds.add(id);
      // normalize client reference during dev
      // to align with Vite's import analysis
      if (!manager.buildType) {
        id = noramlizeClientReferenceId(id);
      } else {
        // obfuscate reference
        id = hashString(id);
      }
      const result = generateClientReferenceCode(id, exportNames, runtimePath);
      debug(`[${vitePluginServerUseClient.name}:transform]`, {
        id,
        exportNames,
        result,
      });
      return result;
    },

    /**
     * emit client-references as dynamic import map
     * TODO: re-export only used exports via virtual modules?
     *
     * export default {
     *   "some-file1": () => import("some-file1"),
     * }
     */
    closeBundle: {
      async handler() {
        let result = `export default {\n`;
        for (let id of manager.rscUseClientIds) {
          // virtual module needs to be mapped back to the original form
          const to = id.startsWith("\0") ? id.slice(1) : id;
          if (manager.buildType) {
            id = hashString(id);
          }
          result += `"${id}": () => import("${to}"),\n`;
        }
        result += "};\n";
        await fs.promises.writeFile("dist/rsc/client-references.js", result);
      },
    },
  };
  return [pluginUseClientNodeModules, pluginUseClientLocal];
}

function generateClientReferenceCode(
  id: string,
  exportNames: Set<string>,
  runtimePath: string,
) {
  let result = `import { registerClientReference as $$register } from "${runtimePath}";\n`;
  for (const name of exportNames) {
    if (name === "default") {
      result += `const $$default = $$register("${id}", "${name}");\n`;
      result += `export default $$default;\n`;
    } else {
      result += `export const ${name} = $$register("${id}", "${name}");\n`;
    }
  }
  return result;
}

// Apply same noramlizaion as Vite's dev import analysis
// to avoid dual package with "/xyz" and "/@fs/xyz" for example.
// For now this tries to cover simple cases
// https://github.com/vitejs/vite/blob/0c0aeaeb3f12d2cdc3c47557da209416c8d48fb7/packages/vite/src/node/plugins/importAnalysis.ts#L327-L399
export function noramlizeClientReferenceId(id: string) {
  const root = process.cwd(); // TODO: pass vite root config
  if (id.startsWith(root)) {
    id = id.slice(root.length);
  } else if (nodePath.isAbsolute(id)) {
    id = "/@fs" + id;
  } else {
    // aka wrapId
    id = id.startsWith(`/@id`) ? id : `/@id/${id.replace("\0", "__x00__")}`;
  }
  return id;
}

const VIRTUAL_PREFIX = "virtual:use-client-node-module/";

export function vitePluginClientUseClient({
  manager,
}: {
  manager: ReactServerManager;
}): Plugin {
  return {
    name: vitePluginClientUseClient.name,
    resolveId(source, _importer, _options) {
      if (source.startsWith(VIRTUAL_PREFIX)) {
        return "\0" + source;
      }
      return;
    },
    load(id, _options) {
      if (id.startsWith(`\0${VIRTUAL_PREFIX}`)) {
        const source = id.slice(`\0${VIRTUAL_PREFIX}`.length);
        const meta = manager.nodeModules.useClient.get(source);
        debug("[parent.use-client-node-modules]", { source, meta });
        tinyassert(meta);
        return `export {${[...meta.exportNames].join(", ")}} from "${source}"`;
      }
      return;
    },
  };
}
