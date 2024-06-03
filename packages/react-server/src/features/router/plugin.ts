import path from "node:path";
import { objectMapValues, tinyassert, uniq } from "@hiogawa/utils";
import FastGlob from "fast-glob";
import type { Plugin, Rollup } from "vite";
import type { PluginStateManager } from "../../plugin";
import { type CustomModuleMeta, createVirtualPlugin } from "../../plugin/utils";

export function routeManifestPluginServer({
  manager,
}: { manager: PluginStateManager }): Plugin[] {
  return [
    {
      name: "server-route-manifest",
      apply: "build",
      async buildEnd() {
        if (manager.buildType === "rsc") {
          const routeFiles = await FastGlob(
            "./src/routes/**/(page|layout|error).(js|jsx|ts|tsx)",
          );
          for (const routeFile of routeFiles) {
            const absFile = path.join(manager.config.root, routeFile);
            const deps = collectModuleDeps(absFile, this);
            let ids: string[] = [];
            for (const id of deps) {
              const info = this.getModuleInfo(id);
              tinyassert(info);
              const meta = info.meta as CustomModuleMeta;
              if (meta.$$rsc?.type === "client") {
                ids.push(id);
              }
            }
            manager.routeToClientReferences[routeFile] = ids;
          }
        }
      },
    },
  ];
}

export function routeManifestPluginClient({
  manager,
}: { manager: PluginStateManager }): Plugin[] {
  return [
    {
      name: routeManifestPluginClient.name + ":bundle",
      apply: "build",
      generateBundle(_options, bundle) {
        if (manager.buildType === "client") {
          const facadeModuleDeps: Record<string, string[]> = {};
          for (const [k, v] of Object.entries(bundle)) {
            if (v.type === "chunk" && v.facadeModuleId) {
              facadeModuleDeps[v.facadeModuleId] = collectAssetDeps(k, bundle);
            }
          }
          manager.routeToClientAssets = objectMapValues(
            manager.routeToClientReferences,
            (ids) =>
              uniq(
                ids.flatMap((id) => {
                  const deps = facadeModuleDeps[id];
                  tinyassert(deps);
                  return deps;
                }),
              ),
          );
          console.log(manager.routeToClientAssets);
        }
      },
    },
    createVirtualPlugin("route-manifest", () => {
      return `export default "todo"`;
    }),
  ];
}

function collectModuleDeps(id: string, ctx: Rollup.PluginContext) {
  const visited = new Set<string>();
  const recurse = (id: string) => {
    if (visited.has(id)) {
      return;
    }
    visited.add(id);
    const info = ctx.getModuleInfo(id);
    tinyassert(info);
    for (const imported of info.importedIds) {
      recurse(imported);
    }
  };
  recurse(id);
  return [...visited];
}

function collectAssetDeps(fileName: string, bundle: Rollup.OutputBundle) {
  const visited = new Set<string>();

  function recurse(k: string) {
    if (visited.has(k)) return;
    visited.add(k);
    const v = bundle[k];
    tinyassert(v);
    if (v.type === "chunk") {
      for (const k2 of v.imports) {
        recurse(k2);
      }
    }
  }

  recurse(fileName);
  return [...visited];
}
