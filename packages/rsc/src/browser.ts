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
        return __vitePreload(
          () => import(/* @vite-ignore */ withBase(id)),
          // base for deps is handled by `__vitePreload`
          // TODO: refactor base handling to be consistent?
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
