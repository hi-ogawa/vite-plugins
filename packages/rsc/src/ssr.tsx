import * as assetsManifest from "virtual:vite-rsc/assets-manifest";
import * as clientReferences from "virtual:vite-rsc/client-references";
import * as ReactDOM from "react-dom";
import { setRequireModule } from "./core/ssr";
import type { AssetsManifest } from "./plugin";
import { withBase } from "./utils/base";

export { createServerConsumerManifest } from "./core/ssr";

export * from "./react/ssr";

export function initialize(): void {
  setRequireModule({
    load: async (id) => {
      if (import.meta.env.DEV) {
        const mod = await import(/* @vite-ignore */ id);
        const modCss = await import(
          /* @vite-ignore */ "/@id/__x00__virtual:vite-rsc/css/dev-ssr/" + id
        );
        for (const href of modCss.default) {
          ReactDOM.preinit(withBase(href), { as: "style" });
        }
        return mod;
      } else {
        const import_ = clientReferences.default[id];
        if (!import_) {
          throw new Error(`client reference not found '${id}'`);
        }
        const mod: any = await import_();
        // TODO
        // The issue of this appraoch is that we don't know `nonce` during flight client `preloadModule`
        // since they are only passed through `prepareDestination`. To be discussed with React team.
        return new Proxy(mod, {
          get(target, p, receiver) {
            if (p in mod) {
              const deps = getAssetsManifest().clientReferenceDeps[id];
              if (deps) {
                for (const js of deps.js) {
                  ReactDOM.preloadModule(withBase(js));
                }
                for (const href of deps.css) {
                  ReactDOM.preinit(withBase(href), { as: "style" });
                }
              }
            }
            return Reflect.get(target, p, receiver);
          },
        });
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

export function getAssetsManifest(): AssetsManifest {
  return (assetsManifest as any).default;
}
