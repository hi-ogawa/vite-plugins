import fs from "node:fs";
import { join } from "node:path";
import { DefaultMap, objectMapValues, tinyassert, uniq } from "@hiogawa/utils";
import type { Manifest, Plugin, PluginOption } from "vite";
import type { ReactServerManager } from "../../plugin";

export function vitePluginUseClientPrefetch({
  manager,
}: {
  manager: ReactServerManager;
}): PluginOption {
  manager;
  const plugin: Plugin = {
    name: vitePluginUseClientPrefetch.name,
    apply: "build",
    async closeBundle() {
      if (manager.buildType === "client") {
        const reactServerManifest: Manifest = JSON.parse(
          await fs.promises.readFile("dist/rsc/.vite/manifest.json", "utf-8"),
        );
        const serverResult = await processReactServerManifest(
          reactServerManifest,
          "dist/rsc",
        );
        console.log(serverResult);

        const clientManifest = JSON.parse(
          await fs.promises.readFile(
            "dist/client/.vite/manifest.json",
            "utf-8",
          ),
        );
        processClientManifest(clientManifest);
      }
    },
  };

  return [plugin];
}

const CLIENT_REFERENCE_RE = /createClientReference\("(\w*)::(\w*)"\)/g;

async function processReactServerManifest(manifest: Manifest, distDir: string) {
  const serverClientReferenceMap = new DefaultMap<string, string[]>(() => []);

  for (const [k, v] of Object.entries(manifest)) {
    const filepath = join(distDir, v.file);
    const code = await fs.promises.readFile(filepath, "utf-8");
    const matches = code.matchAll(CLIENT_REFERENCE_RE);
    const ids = uniq([...matches].map((m) => m[1]!));
    serverClientReferenceMap.get(k).push(...ids);
  }

  for (const [k, v] of serverClientReferenceMap) {
    serverClientReferenceMap.set(k, uniq(v));
  }

  const result = objectMapValues(manifest, (_v, k) => {
    const deps = collectDeps(k, manifest);
    return [...deps].flatMap((k) => serverClientReferenceMap.get(k));
  });

  return result;
}

function processClientManifest(manifest: Manifest) {
  manifest;
}

function collectDeps(k: string, manifest: Manifest) {
  const visited = new Set<string>();

  function recurse(k: string) {
    if (visited.has(k)) {
      return;
    }
    visited.add(k);
    const v = manifest[k];
    tinyassert(v);
    if (v.imports) {
      for (const k2 of v.imports) {
        recurse(k2);
      }
    }
  }

  recurse(k);

  return visited;
}
