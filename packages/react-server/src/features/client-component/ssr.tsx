import { createDebug, tinyassert } from "@hiogawa/utils";
import * as ReactClient from "@hiogawa/vite-rsc/react/ssr";

const debug = createDebug("react-server:ssr-import");

async function ssrImport(id: string) {
  debug("[__webpack_require__]", { id });
  if (import.meta.env.DEV) {
    // TODO: need this?
    // strip off `?t=` added for browser by noramlizeClientReferenceId
    id = id.split("?t=")[0]!;
    // transformed to "ssrLoadModule" during dev
    return import(/* @vite-ignore */ id);
  } else {
    const clientReferences = await import(
      "virtual:client-references" as string
    );
    const dynImport = clientReferences.default[id];
    tinyassert(dynImport, `client reference not found '${id}'`);
    return dynImport();
  }
}

export function initializeReactClientSsr() {
  ReactClient.setRequireModule({ load: ssrImport });
}
