import path from "node:path";
import { objectMapValues, tinyassert, uniq } from "@hiogawa/utils";
import FastGlob from "fast-glob";
import type { Plugin, Rollup } from "vite";
import type { PluginStateManager } from "../../plugin";
import { type CustomModuleMeta, createVirtualPlugin } from "../../plugin/utils";
import type { AssetDeps, RouteManifest } from "./manifest";
import { createFsRouteTree } from "./tree";

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
            const routeKey = routeFile.slice("./src/routes".length);
            manager.routeToClientReferences[routeKey] = ids;
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
              // TODO: css
              // https://github.com/vitejs/vite/blob/147e9228bb1c75db153873761eb7a120a2bd09a4/packages/vite/src/node/plugins/manifest.ts#L91-L96
              v.viteMetadata?.importedCss;
            }
          }
          manager.routeToClientAssets = objectMapValues(
            manager.routeToClientReferences,
            // facade module might not exist when dynamic import is also imported statically
            (ids) => uniq(ids.flatMap((id) => facadeModuleDeps[id] ?? [])),
          );
        }
      },
    },
    createVirtualPlugin("route-manifest", async () => {
      tinyassert(manager.buildType === "ssr");
      const routeManaifest: RouteManifest = {
        routeTree: createFsRouteTree(
          objectMapValues(
            manager.routeToClientAssets,
            (files) =>
              ({
                js: files.map((file) => `/${file}`),
                // TODO
                css: [],
              }) satisfies AssetDeps,
          ),
        ),
      };
      return `export default ${JSON.stringify(routeManaifest, null, 2)}`;
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
