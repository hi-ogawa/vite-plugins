import { setRequireModule } from "@hiogawa/vite-rsc/core/client-ssr";

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

// export async function importRsc<T>(): Promise<T> {
//   const mod = await import("virtual:vite-rsc/import-rsc" as any);
//   if (import.meta.env.DEV) {
//     return mod.default();
//   } else {
//     return mod;
//   }
// }

export async function importAssets(): Promise<{
  bootstrapModules: string[];
}> {
  const mod = await import("virtual:vite-rsc/ssr-assets" as any);
  return mod;
}
