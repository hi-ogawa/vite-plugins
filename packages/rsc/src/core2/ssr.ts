import clientReferences from "virtual:vite-rsc/client-references";
import prepareDestinationManifest from "virtual:vite-rsc/prepare-destination-manifest";
import * as ReactDOM from "react-dom";
import { withBase } from "./utils/base";

export async function loadModule(id: string): Promise<unknown> {
  if (import.meta.env.DEV) {
    return import(/* @vite-ignore */ id);
  } else {
    const import_ = clientReferences[id];
    if (!import_) {
      throw new Error(`client reference not found '${id}'`);
    }
    return import_();
  }
}

export function prepareDestination(id: string): void {
  if (import.meta.env.DEV) return;
  const deps = prepareDestinationManifest[id];
  if (deps) {
    for (const js of deps) {
      // TODO: base, nonce, crossorigin props
      // (at least, nonce needs to be able to be specified per render)
      ReactDOM.preloadModule(withBase(js));
    }
  }
}
