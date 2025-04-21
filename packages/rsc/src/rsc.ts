import { setRequireModule } from "./core/rsc";

export {
  createClientManifest,
  createServerManifest,
  loadServerAction,
} from "./core/rsc";

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
