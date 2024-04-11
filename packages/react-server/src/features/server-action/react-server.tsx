import { tinyassert } from "@hiogawa/utils";
import { __global } from "../../lib/global";
import type { BundlerConfig, ImportManifestEntry } from "../../lib/types";
import type { ReactServerErrorContext } from "../../server";

export function createServerReference(id: string, action: Function): React.FC {
  return Object.defineProperties(action, {
    $$typeof: {
      value: Symbol.for("react.server.reference"),
    },
    $$id: {
      value: id,
      configurable: true,
    },
    $$bound: { value: null, configurable: true },
    // TODO: no async server reference
    // https://github.com/facebook/react/blob/da69b6af9697b8042834644b14d0e715d4ace18a/packages/react-server-dom-webpack/src/ReactFlightClientConfigBundlerWebpack.js#L131-L132
    // $$async: {
    //   value: true,
    //   enumerable: true,
    // },

    // TODO
    // bind: {
    //   value: () => {
    //     throw new Error("todo: createServerReference.bind");
    //   },
    //   configurable: true,
    // },
  }) as any;
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

const REFERENCE_SEP = "::";
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

export async function importServerReference(id: string): Promise<unknown> {
  if (import.meta.env.DEV) {
    return await __global.dev.reactServer.ssrLoadModule(id);
  } else {
    const mod = await import("virtual:rsc-use-server" as string);
    const dynImport = mod.default[id];
    tinyassert(dynImport, `server reference not found '${id}'`);
    return dynImport();
  }
}
