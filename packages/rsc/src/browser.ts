// TODO: move virtual off from main bundle
import * as clientReferences from "virtual:vite-rsc/client-references";
import { setRequireModule } from "./core/browser";
import { withBase } from "./utils/base";

export * from "./react/browser";

// @ts-ignore
import { __vitePreload } from "virtual:vite-rsc/preload-helper";

export function initialize(options?: {
  onHmrReload?: () => void;
}): void {
  setRequireModule({
    load: async (payload) => {
      const id = payload.id;
      if (import.meta.env.DEV) {
        // @ts-ignore
        return __vite_rsc_raw_import__(withBase(id));
      } else {
        const import_ = clientReferences.default[id];
        if (!import_) {
          throw new Error(`client reference not found '${id}'`);
        }
        return __vitePreload(
          import_,
          // base is handled by `__vitePreload`
          // TODO: refactor base handling?
          [...payload.js, ...payload.css].map((href) => href.slice(1)),
        );
      }
    },
  });

  if (import.meta.hot) {
    import.meta.hot.on("rsc:update", () => {
      options?.onHmrReload?.();
    });
  }
}
