import { createDebug, tinyassert } from "@hiogawa/utils";
import * as ReactClient from "@hiogawa/vite-rsc/react/ssr";
import * as ReactDOM from "react-dom";

// @ts-ignore
import clientReferences from "virtual:client-references";

// @ts-ignore
import prepareDestinationManifest from "virtual:prepare-destination-manifest";

const debug = createDebug("react-server:ssr-import");

async function ssrImport(id: string) {
  debug("[__webpack_require__]", { id });
  if (import.meta.env.DEV) {
    return import(/* @vite-ignore */ id);
  } else {
    const dynImport = clientReferences[id];
    tinyassert(dynImport, `client reference not found '${id}'`);
    return dynImport();
  }
}

export function initializeReactClientSsr() {
  ReactClient.setRequireModule({
    load: ssrImport,
    prepareDestination(id) {
      if (import.meta.env.DEV) return;
      const deps = prepareDestinationManifest[id];
      // TODO: not working?
      // console.log("[prepareDestination]", { id, deps })
      for (const js of deps) {
        ReactDOM.preloadModule(js, {
          as: "script",
          crossOrigin: "",
        });
      }
    },
  });
}
