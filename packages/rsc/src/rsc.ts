import * as assetsManifest from "virtual:vite-rsc/assets-manifest";
import { setRequireModule } from "./core/rsc";
import type { AssetsManifest } from "./plugin";

export {
  createClientManifest,
  createServerManifest,
  loadServerAction,
} from "./core/rsc";

export * from "./react/rsc";

export function initialize(): void {
  setRequireModule({
    load: async (id) => {
      if (import.meta.env.DEV) {
        return import(/* @vite-ignore */ id);
      } else {
        const references = await import(
          "virtual:vite-rsc/server-references" as any
        );
        const import_ = references.default[id];
        if (!import_) {
          throw new Error(`server reference not found '${id}'`);
        }
        return import_();
      }
    },
  });
}

export async function importSsr<T>(): Promise<T> {
  const mod = await import("virtual:vite-rsc/import-ssr" as any);
  if (import.meta.env.DEV) {
    return mod.default();
  } else {
    return mod;
  }
}

export function getAssetsManifest(): AssetsManifest {
  return (assetsManifest as any).default;
}
