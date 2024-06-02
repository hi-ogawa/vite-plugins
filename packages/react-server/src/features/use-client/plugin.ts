import fs from "node:fs";
import nodePath from "node:path";
import {
  getExportNames,
  transformDirectiveProxyExport,
} from "@hiogawa/transforms";
import { createDebug, memoize, tinyassert } from "@hiogawa/utils";
import {
  type Plugin,
  type PluginOption,
  type ViteDevServer,
  parseAstAsync,
} from "vite";
import type { PluginStateManager } from "../../plugin";
import { USE_CLIENT_RE } from "../../plugin/ast-utils";
import { createVirtualPlugin, hashString } from "../../plugin/utils";

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
  manager: PluginStateManager;
  runtimePath: string;
}): PluginOption {
  // TODO:
  // eventually we should try entirely virtual module approach for client reference (not only node_modules)
  // so that we can delegate precise resolution (e.g. `?v=` deps optimization hash, `?t=` hmr timestamp)
  // to actual client (browser, ssr) environment instead of faking out things on RSC module graph

  // intercept Vite's node resolve to virtualize "use client" in node_modules
  const useClientExternalPlugin: Plugin = {
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
        meta.exportNames = new Set(getExportNames(ast, {}).exportNames);
        // we need to transform to client reference directly
        // otherwise `soruce` will be resolved infinitely by recursion
        id = wrapId(id);
        const output = await transformDirectiveProxyExport(ast, {
          directive: "use client",
          id,
          runtime: "$$proxy",
        });
        tinyassert(output);
        output.prepend(
          `import { registerClientReference as $$proxy } from "${runtimePath}";\n`,
        );
        const result = output.toString();
        debug("[rsc.use-client-node-modules.load]", {
          source,
          meta,
          id,
          result,
        });
        return output.toString();
      }
      return;
    },
  };

  async function normalizeId(id: string) {
    if (!manager.buildType) {
      // normalize client reference during dev
      // to align with Vite's import analysis
      tinyassert(manager.parentServer);
      return await noramlizeClientReferenceId(id, manager.parentServer);
    } else {
      // obfuscate reference
      return hashString(id);
    }
  }

  const useClientPlugin: Plugin = {
    name: vitePluginServerUseClient.name,
    async transform(code, id, _options) {
      manager.rscIds.add(id);
      manager.rscUseClientIds.delete(id);
      if (!code.includes("use client")) {
        return;
      }
      const ast = await parseAstAsync(code);
      const output = await transformDirectiveProxyExport(ast, {
        directive: "use client",
        id: await normalizeId(id),
        runtime: "$$proxy",
      });
      if (!output) {
        return;
      }
      output.prepend(
        `import { registerClientReference as $$proxy } from "${runtimePath}";\n`,
      );
      manager.rscUseClientIds.add(id);
      if (manager.buildType === "scan") {
        // only collect references without transform during the scan
        return;
      }
      return { code: output.toString(), map: output.generateMap() };
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
  return [useClientExternalPlugin, useClientPlugin];
}

// Apply same noramlizaion as Vite's dev import analysis
// to avoid dual package with "/xyz" and "/@fs/xyz" for example.
// https://github.com/vitejs/vite/blob/0c0aeaeb3f12d2cdc3c47557da209416c8d48fb7/packages/vite/src/node/plugins/importAnalysis.ts#L327-L399
export async function noramlizeClientReferenceId(
  id: string,
  parentServer: ViteDevServer,
) {
  const root = parentServer.config.root;
  if (id.startsWith(root)) {
    id = id.slice(root.length);
  } else if (nodePath.isAbsolute(id)) {
    id = "/@fs" + id;
  } else {
    id = wrapId(id);
  }
  // this is needed only for browser, so we'll strip it off
  // during ssr client reference import
  const mod = await parentServer.moduleGraph.getModuleByUrl(id);
  if (mod && mod.lastHMRTimestamp > 0) {
    id += `?t=${mod.lastHMRTimestamp}`;
  }
  return id;
}

function wrapId(id: string) {
  return id.startsWith(`/@id`) ? id : `/@id/${id.replace("\0", "__x00__")}`;
}

const VIRTUAL_PREFIX = "virtual:use-client-node-module/";

export function vitePluginClientUseClient({
  manager,
}: {
  manager: PluginStateManager;
}): Plugin[] {
  const devExternalPlugin: Plugin = {
    name: vitePluginClientUseClient.name + ":dev-external",
    apply: "serve",
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

  return [
    devExternalPlugin,
    createVirtualPlugin("client-references", () => {
      tinyassert(manager.buildType && manager.buildType !== "rsc");
      return fs.promises.readFile("dist/rsc/client-references.js", "utf-8");
    }),
  ];
}
