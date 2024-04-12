import { tinyassert } from "@hiogawa/utils";
import reactServerDomWebpack from "react-server-dom-webpack/server.edge";
import { __global } from "../../lib/global";
import type { BundlerConfig, ImportManifestEntry } from "../../lib/types";
import type { ReactServerErrorContext } from "../../server";

// https://github.com/facebook/react/blob/c8a035036d0f257c514b3628e927dd9dd26e5a09/packages/react-server-dom-webpack/src/ReactFlightWebpackReferences.js#L87

export function registerServerReference(
  action: Function,
  id: string,
  name: string,
) {
  return reactServerDomWebpack.registerServerReference(action, id, name);
}

export type ActionResult = {
  id?: string;
  error?: ReactServerErrorContext;
  data?: unknown;
  responseHeaders?: Record<string, string>;
  context: ActionContext;
};

export class ActionContext {
  responseHeaders: Record<string, string> = {};

  // TODO: refine revalidation by layout key
  revalidate = false;

  constructor(public request: Request) {}
}

const REFERENCE_SEP = "#";
const ACTION_ID_MARKER = "@";

export function createActionBundlerConfig(): BundlerConfig {
  return new Proxy(
    {},
    {
      get(_target, $$id, _receiver) {
        tinyassert(typeof $$id === "string");
        let [id, name] = $$id.split(REFERENCE_SEP);
        tinyassert(id);
        tinyassert(name);
        id += ACTION_ID_MARKER;
        return {
          id,
          name,
          chunks: [id],
        } satisfies ImportManifestEntry;
      },
    },
  );
}

const serverReferenceMap = new Map<string, unknown>();

export function serverReferenceWebpackRequire(id: string): unknown | undefined {
  if (id.endsWith(ACTION_ID_MARKER)) {
    id = id.slice(0, -ACTION_ID_MARKER.length);
    const mod = serverReferenceMap.get(id);
    tinyassert(mod);
    return mod;
  }
  return;
}

export function serverReferenceWebpackChunkLoad(
  id: string,
): Promise<unknown> | undefined {
  if (id.endsWith(ACTION_ID_MARKER)) {
    id = id.slice(0, -ACTION_ID_MARKER.length);
    return (async () => {
      const mod = await importServerReference(id);
      serverReferenceMap.set(id, mod);
    })();
  }
  return;
}

export function initializeWebpackReactServer() {
  __global.serverReferenceWebpackRequire = serverReferenceWebpackRequire;
  __global.serverReferenceWebpackChunkLoad = serverReferenceWebpackChunkLoad;
}

async function importServerReference(id: string): Promise<unknown> {
  if (import.meta.env.DEV) {
    return await __global.dev.reactServer.ssrLoadModule(id);
  } else {
    const mod = await import("virtual:rsc-use-server" as string);
    const dynImport = mod.default[id];
    tinyassert(dynImport, `server reference not found '${id}'`);
    return dynImport();
  }
}

export async function importServerAction(id: string): Promise<Function> {
  const [file, name] = id.split(REFERENCE_SEP) as [string, string];
  const mod: any = await importServerReference(file);
  return mod[name];
}
