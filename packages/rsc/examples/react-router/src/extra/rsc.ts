import { setRequireModule } from "@hiogawa/vite-rsc/core/server";

export function initialize(): void {
  setRequireModule({
    load: async (id) => {
      if (import.meta.env.DEV) {
        return import(/* @vite-ignore */ id);
      } else {
        // @ts-ignore
        const references = await import("virtual:vite-rsc/server-references");
        const import_ = references.default[id];
        if (!import_) {
          throw new Error(`server reference not found '${id}'`);
        }
        return import_();
      }
    },
  });
}
