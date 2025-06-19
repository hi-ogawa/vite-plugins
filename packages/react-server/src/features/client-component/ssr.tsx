// @ts-ignore
import clientReferences from "virtual:client-references";
// @ts-ignore
import prepareDestinationManifest from "virtual:prepare-destination-manifest";
import { createDebug, tinyassert } from "@hiogawa/utils";
import * as ReactClient from "@hiogawa/vite-rsc/react/ssr";
import * as ReactDOM from "react-dom";

const debug = createDebug("react-server:ssr-import");

async function ssrImport(id: string) {
  debug("[__webpack_require__]", { id });
  if (import.meta.env.DEV) {
    return import(/* @vite-ignore */ id);
  } else {
    const dynImport = clientReferences[id];
    tinyassert(dynImport, `client reference not found '${id}'`);
    const mod = await dynImport();
    return wrapResourceProxy(mod, prepareDestinationManifest[id]);
  }
}

export function initializeReactClientSsr() {
  ReactClient.setRequireModule({
    load: ssrImport,
  });
}

function wrapResourceProxy(mod: any, deps?: string[]) {
  return new Proxy(mod, {
    get(target, p, receiver) {
      if (p in mod) {
        if (deps) {
          for (const href of deps) {
            ReactDOM.preloadModule(href, {
              as: "script",
              // vite doesn't allow configuring crossorigin at the moment, so we can hard code it as well.
              // https://github.com/vitejs/vite/issues/6648
              crossOrigin: "",
            });
          }
        }
      }
      return Reflect.get(target, p, receiver);
    },
  });
}
