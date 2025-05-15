import * as clientReferences from "virtual:vite-rsc/client-references";
import { setRequireModule } from "./core/browser";
import { withBase } from "./utils/base";

export * from "./react/browser";

initialize();

export function initialize(options?: {
  onHmrReload?: () => void;
}): void {
  setRequireModule({
    load: async (id) => {
      if (import.meta.env.DEV) {
        // @ts-ignore
        return __vite_rsc_raw_import__(withBase(id));
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
