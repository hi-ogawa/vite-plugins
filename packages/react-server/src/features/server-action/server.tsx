import { tinyassert } from "@hiogawa/utils";
import * as ReactServer from "@hiogawa/vite-rsc/react/rsc";
import type { ReactFormState } from "react-dom/client";
import { $__global } from "../../global";
import type { ReactServerErrorContext } from "../../server";
import { findMapInverse } from "../../utils/misc";

// https://github.com/facebook/react/blob/c8a035036d0f257c514b3628e927dd9dd26e5a09/packages/react-server-dom-webpack/src/ReactFlightWebpackReferences.js#L87

/* @__NO_SIDE_EFFECTS__ */
export function registerServerReference(
  action: Function,
  id: string,
  name: string,
) {
  if (typeof action !== "function") {
    return action;
  }
  return ReactServer.registerServerReference(action, id, name);
}

export type ActionResult = {
  error?: ReactServerErrorContext;
  data?: ReactFormState | null;
};

export function initializeReactServer() {
  ReactServer.setRequireModule({
    load: importServerReference,
  });
}

async function importServerReference(id: string): Promise<unknown> {
  if (import.meta.env.DEV) {
    const file = findMapInverse($__global.dev.manager.serverReferenceMap, id);
    tinyassert(file, `server reference not found '${id}'`);
    return await import(/* @vite-ignore */ file);
  } else {
    const mod = await import("virtual:server-references" as string);
    const dynImport = mod.default[id];
    tinyassert(dynImport, `server reference not found '${id}'`);
    return dynImport();
  }
}
