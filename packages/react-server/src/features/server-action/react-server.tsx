import { memoize, tinyassert } from "@hiogawa/utils";
import reactServerDomWebpack from "react-server-dom-webpack/server.edge";
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

// same as packages/react-server/src/features/use-client/server.tsx
export const serverReferenceImportPromiseCache = new Map<
  string,
  Promise<unknown>
>();

const serverReferenceWebpackRequire = memoize(importServerReference, {
  cache: serverReferenceImportPromiseCache,
});

export function initializeWebpackReactServer() {
  Object.assign(globalThis, {
    __vite_react_server_webpack_require__: serverReferenceWebpackRequire,
    __vite_react_server_webpack_chunk_load__: () => {
      throw new Error("todo: __webpack_chunk_load__");
    },
  });
}

async function importServerReference(id: string): Promise<unknown> {
  if (import.meta.env.DEV) {
    return await import(/* @vite-ignore */ id);
  } else {
    const mod = await import("virtual:server-references" as string);
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
