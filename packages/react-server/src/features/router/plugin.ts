import { writeFileSync } from "node:fs";
import path from "node:path";
import {
  objectMapValues,
  tinyassert,
  typedBoolean,
  uniq,
} from "@hiogawa/utils";
import FastGlob from "fast-glob";
import type { Plugin, Rollup } from "vite";
import type { PluginStateManager } from "../../plugin";
import { createVirtualPlugin, hashString } from "../../plugin/utils";
import {
  type AssetDeps,
  type RouteAssetDeps,
  mergeAssetDeps,
} from "./manifest";
import { createFsRouteTree } from "./tree";

export function routeManifestPluginServer({
  manager,
  routeDir,
}: { manager: PluginStateManager; routeDir: string }): Plugin[] {
  return [
    {
      name: "server-route-manifest",
      apply: "build",
      async buildEnd(error) {
        // Run during rsc build
        if (!error && this.environment.name === "rsc") {
          const routeFiles = await FastGlob(
            path.posix.join(
              routeDir,
              "**/(page|layout|error|not-found|loading|template).(js|jsx|ts|tsx|md|mdx)",
            ),
          );
          for (const routeFile of routeFiles) {
            const absFile = path.join(manager.config.root, routeFile);
            const deps = collectModuleDeps(absFile, this);
            const ids: string[] = [];
            for (const id of deps) {
              const info = this.getModuleInfo(id);
              tinyassert(info);
              // Note: client reference tracking via CustomModuleMeta is no longer available
              // since @vitejs/plugin-rsc handles transforms. Route-based asset optimization
              // is disabled for now.
              // TODO: Use getPluginApi() to access client reference info if needed
            }
            const routeKey = routeFile.slice(routeDir.length);
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
        // Run during client build
        if (this.environment.name === "client") {
          const facadeModuleDeps: Record<string, AssetDeps> = {};
          for (const [k, v] of Object.entries(bundle)) {
            if (v.type === "chunk" && v.facadeModuleId) {
              facadeModuleDeps[v.facadeModuleId] = collectAssetDeps(k, bundle);
            }
          }
          const routeToAssetDeps = objectMapValues(
            manager.routeToClientReferences,
            // facade module might not exist when dynamic import is also imported statically
            (ids) =>
              mergeAssetDeps(
                ids.map((id) => facadeModuleDeps[id]).filter(typedBoolean),
              ),
          );
          manager.routeManifest = {
            routeTree: createFsRouteTree<RouteAssetDeps>(routeToAssetDeps).tree,
          };

          // TODO: client reference preloading not supported in native RSC
          // https://github.com/wakujs/waku/issues/1656
        }
      },
    },
    createVirtualPlugin("route-manifest", async function () {
      tinyassert(this.environment.name === "ssr");
      tinyassert(manager.routeManifest);

      // create asset for browser
      const data = manager.routeManifest;
      const source = `${JSON.stringify(data, null, 2)}`;
      const sourceHash = hashString(source).slice(0, 8);
      const url = `/assets/route-manifest-${sourceHash}.js`;
      writeFileSync(
        path.join(manager.outDir, `client${url}`),
        `export default ${source}`,
      );

      // give asset url and manifest to ssr
      return `export default ${JSON.stringify(
        { routeManifestUrl: url, routeManifest: data },
        null,
        2,
      )}`;
    }),
    // TODO: client reference preloading not supported in native RSC
    // https://github.com/wakujs/waku/issues/1656
    createVirtualPlugin("prepare-destination-manifest", async function () {
      return `export default {}`;
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

function collectAssetDeps(
  fileName: string,
  bundle: Rollup.OutputBundle,
): AssetDeps {
  const visited = new Set<string>();
  const css: string[] = [];

  function recurse(k: string) {
    if (visited.has(k)) return;
    visited.add(k);
    const v = bundle[k];
    tinyassert(v);
    if (v.type === "chunk") {
      css.push(...(v.viteMetadata?.importedCss ?? []));
      for (const k2 of v.imports) {
        recurse(k2);
      }
    }
  }

  recurse(fileName);
  return {
    js: [...visited].map((file) => `/${file}`),
    css: uniq(css).map((file) => `/${file}`),
  };
}
