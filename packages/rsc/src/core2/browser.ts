import { setRequireModule } from "@hiogawa/vite-rsc/core/client-browser";

export function initialize(options?: {
  onHmrReload?: () => void;
}): void {
  setRequireModule({
    load: async (id) => {
      if (import.meta.env.DEV) {
        const { rawImport } = await import(
          /* @vite-ignore */ String("/__vite_rsc_script")
        );
        return rawImport(/* @vite-ignore */ id);
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

  if (import.meta.hot) {
    import.meta.hot.on("rsc:update", () => {
      options?.onHmrReload?.();
    });
  }
}

export function setServerCallback(fn: any): void {
  globalThis.__viteRscCallServer = fn;
}
