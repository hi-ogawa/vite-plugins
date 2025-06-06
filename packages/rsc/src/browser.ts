import * as clientReferences from "virtual:vite-rsc/client-references";
import { setRequireModule } from "./core/browser";

export * from "./react/browser";

export function initialize(options?: {
  onHmrReload?: () => void;
}): void {
  setRequireModule({
    load: async (id) => {
      if (import.meta.env.DEV) {
        // @ts-ignore
        return __vite_rsc_raw_import__(import.meta.env.BASE_URL + id.slice(1));
      } else {
        const import_ = clientReferences.default[id];
        if (!import_) {
          throw new Error(`client reference not found '${id}'`);
        }
        return import_();
      }
    },
  });

  if (import.meta.hot) {
    import.meta.hot.on("rsc:update", () => {
      options?.onHmrReload?.();
    });
  }
}
