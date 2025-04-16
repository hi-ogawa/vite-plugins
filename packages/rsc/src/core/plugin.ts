import assert from "node:assert";
import type { Plugin, Rollup } from "vite";

export function vitePluginRscCore(rscOptions: {
  getClientReferences: () => Record<string, string>;
  getServerReferences: () => Record<string, string>;
  getBrowserBundle?: () => Rollup.OutputBundle | undefined;
}): Plugin[] {
  return [
    {
      name: "rsc-virtual",
      resolveId(source) {
        if (source.startsWith("virtual:vite-rsc/")) {
          return "\0" + source;
        }
      },
      load(id) {
        if (id === "\0virtual:vite-rsc/server-references") {
          if (this.environment.mode === "dev") {
            return { code: `export {}`, map: null };
          }
          const code = generateDynamicImportCode(
            rscOptions.getServerReferences(),
          );
          return { code, map: null };
        }
        if (id === "\0virtual:vite-rsc/client-references") {
          if (this.environment.mode === "dev") {
            return { code: `export {}`, map: null };
          }
          const clientReferences = rscOptions.getClientReferences();
          let code = generateDynamicImportCode(clientReferences);
          const browserBundle = rscOptions.getBrowserBundle?.();
          if (browserBundle) {
            const assetDeps = collectAssetDeps(browserBundle);
            const keyAssetDeps: Record<string, AssetDeps> = {};
            for (const [key, id] of Object.entries(clientReferences)) {
              const deps = assetDeps[id];
              if (deps) {
                keyAssetDeps[key] = deps;
              }
            }
            code += `export const assetDeps = ${JSON.stringify(keyAssetDeps)};\n`;
          }
          return { code, map: null };
        }
      },
    },
  ];
}

function generateDynamicImportCode(map: Record<string, string>) {
  let code = Object.entries(map)
    .map(
      ([key, id]) =>
        `${JSON.stringify(key)}: () => import(${JSON.stringify(id)}),`,
    )
    .join("\n");
  return `export default {${code}};\n`;
}

export type AssetDeps = {
  js: string[];
  css: string[];
};

function collectAssetDeps(
  bundle: Rollup.OutputBundle,
): Record<string, AssetDeps> {
  const map: Record<string, AssetDeps> = {};
  for (const chunk of Object.values(bundle)) {
    if (chunk.type === "chunk" && chunk.facadeModuleId) {
      map[chunk.facadeModuleId] = collectAssetDepsInner(chunk.fileName, bundle);
    }
  }
  return map;
}

function collectAssetDepsInner(
  fileName: string,
  bundle: Rollup.OutputBundle,
): AssetDeps {
  const visited = new Set<string>();
  const css: string[] = [];

  function recurse(k: string) {
    if (visited.has(k)) return;
    visited.add(k);
    const v = bundle[k];
    assert(v);
    if (v.type === "chunk") {
      css.push(...(v.viteMetadata?.importedAssets ?? []));
      for (const k2 of v.imports) {
        recurse(k2);
      }
    }
  }

  recurse(fileName);
  return {
    js: [...visited].map((file) => `/${file}`),
    css: [...new Set(css)].map((file) => `/${file}`),
  };
}
