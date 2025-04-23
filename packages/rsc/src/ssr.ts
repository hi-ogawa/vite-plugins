import * as clientReferences from "virtual:vite-rsc/client-references";
import * as ReactDOM from "react-dom";
import { setRequireModule } from "./core/ssr";
import type { ServerAssets } from "./types";

export { createServerConsumerManifest } from "./core/ssr";

export * from "./react/ssr";

export function initialize(): void {
  setRequireModule({
    load: async (id) => {
      if (import.meta.env.DEV) {
        return import(/* @vite-ignore */ id);
      } else {
        const import_ = clientReferences.default[id];
        if (!import_) {
          throw new Error(`client reference not found '${id}'`);
        }
        return import_();
      }
    },
    prepareDestination(id) {
      // we manually run `preloadModule` instead of react-server-dom-webpack's prepareDestination
      // maybe we can have this logic baked in react-server-dom-vite.
      // for unbundled dev, preventing waterfall is not practical so this is build only
      // (need to traverse entire module graph and add entire import chains to modulepreload).
      if (!import.meta.env.DEV) {
        if (clientReferences.assetDeps) {
          const deps = clientReferences.assetDeps[id];
          if (deps) {
            for (const js of deps.js) {
              ReactDOM.preloadModule(js);
            }
          }
        }
      }
    },
  });
}

export async function importRsc<T>(): Promise<T> {
  const mod = await import("virtual:vite-rsc/import-rsc" as any);
  if (import.meta.env.DEV) {
    return mod.default();
  } else {
    return mod;
  }
}

export async function importAssets(): Promise<ServerAssets> {
  const mod = await import("virtual:vite-rsc/server-assets");
  return mod.default;
}
