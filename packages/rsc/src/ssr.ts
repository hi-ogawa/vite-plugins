import { setRequireModule } from "./core/client-ssr";
import type { ServerAssets } from "./types";

export { createServerConsumerManifest } from "./core/client-ssr";

export function initialize(): void {
  setRequireModule({
    load: async (id) => {
      if (import.meta.env.DEV) {
        return import(/* @vite-ignore */ id);
      } else {
        const clientReferences = await import(
          "virtual:vite-rsc/client-references" as any
        );
        const import_ = clientReferences.default[id];
        if (!import_) {
          throw new Error(`client reference not found '${id}'`);
        }
        return import_();
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
