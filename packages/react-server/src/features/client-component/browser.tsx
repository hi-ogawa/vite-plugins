import { tinyassert } from "@hiogawa/utils";
import * as ReactClient from "@hiogawa/vite-rsc/react/browser";

// @ts-ignore
import clientReferences from "virtual:client-references";

async function importWrapper(id: string) {
  if (import.meta.env.DEV) {
    // @ts-ignore see patch-browser-raw-import plugin
    return __vite_rsc_raw_import__(id);
  } else {
    const dynImport = clientReferences[id];
    tinyassert(dynImport, `client reference not found '${id}'`);
    return dynImport();
  }
}

export function initializeReactClientBrowser() {
  ReactClient.setRequireModule({ load: importWrapper });
}
