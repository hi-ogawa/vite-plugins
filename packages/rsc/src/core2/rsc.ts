import { setRequireModule } from "@hiogawa/vite-rsc/core/server";

export {
  createClientManifest,
  createServerManifest,
  loadServerAction,
} from "../core/server";

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
