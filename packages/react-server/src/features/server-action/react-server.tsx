import { memoize, tinyassert } from "@hiogawa/utils";
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

export function createActionBundlerConfig(): BundlerConfig {
  return new Proxy(
    {},
    {
      get(_target, $$id, _receiver) {
        tinyassert(typeof $$id === "string");
        let [id, name] = $$id.split(REFERENCE_SEP);
        tinyassert(id);
        tinyassert(name);
        return {
          id,
          name,
          chunks: [],
        } satisfies ImportManifestEntry;
      },
    },
  );
}

export const importServerReferencePromiseCache = new Map<
  string,
  Promise<unknown>
>();

export const importServerReference = memoize(importServerReferenceImpl, {
  cache: importServerReferencePromiseCache,
});

async function importServerReferenceImpl(id: string): Promise<unknown> {
  if (import.meta.env.DEV) {
    return await __global.dev.reactServer.ssrLoadModule(id);
  } else {
    const mod = await import("virtual:rsc-use-server" as string);
    const dynImport = mod.default[id];
    tinyassert(dynImport, `server reference not found '${id}'`);
    return dynImport();
  }
}
