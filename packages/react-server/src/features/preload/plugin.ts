import fs from "node:fs";
import { join, resolve } from "node:path";
import {
  DefaultMap,
  objectMapValues,
  tinyassert,
  typedBoolean,
  uniq,
} from "@hiogawa/utils";
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

        const clientManifest: Manifest = JSON.parse(
          await fs.promises.readFile(
            "dist/client/.vite/manifest.json",
            "utf-8",
          ),
        );
        const clientResult = processClientManifest(clientManifest);

        const result = objectMapValues(serverResult, (ids) => {
          let js: string[] = [];
          let css: string[] = [];
          for (const id of ids) {
            const key = manager.clientReferenceIdMap[id];
            tinyassert(key);
            const chunks = clientResult[key];
            tinyassert(chunks);
            js.push(...chunks.map((c) => c.file));
            css.push(...chunks.flatMap((c) => c.css).filter(typedBoolean));
          }
          js = uniq(js);
          css = uniq(css);
          return { js, css };
        });

        await fs.promises.writeFile(
          "dist/client/server-assets-map.json",
          JSON.stringify(result, null, 2),
        );
      }
    },
  };

  return [plugin];
}

const CLIENT_REFERENCE_RE = /createClientReference\("(\w*)::(\w*)"\)/g;

async function processReactServerManifest(manifest: Manifest, distDir: string) {
  const serverClientMap = new DefaultMap<string, string[]>(() => []);

  // regex to look for `createClientReference` in the source code
  for (const [k, v] of Object.entries(manifest)) {
    const filepath = join(distDir, v.file);
    const code = await fs.promises.readFile(filepath, "utf-8");
    const matches = code.matchAll(CLIENT_REFERENCE_RE);
    const ids = uniq([...matches].map((m) => m[1]!));
    serverClientMap.get(k).push(...ids);
  }

  for (const [k, v] of serverClientMap) {
    serverClientMap.set(k, uniq(v));
  }

  // resolve deep dependency
  const result = objectMapValues(manifest, (_v, k) => {
    const deps = collectDeps(k, manifest);
    return [...deps].flatMap((k) => serverClientMap.get(k));
  });
  return result;
}

function processClientManifest(manifest: Manifest) {
  const chunkDepsMap = objectMapValues(manifest, (_v, k) => {
    const deps = collectDeps(k, manifest);
    return [...deps].map((k) => manifest[k]!);
  });

  const result: typeof chunkDepsMap = {};
  for (let [k, v] of Object.entries(manifest)) {
    if (v.src) {
      let src = v.src.startsWith("virtual:") ? v.src : resolve(v.src);
      result[src] = chunkDepsMap[k]!;
    }
  }

  return result;
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
