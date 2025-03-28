import { tinyassert } from "@hiogawa/utils";
import ReactServer from "react-server-dom-webpack/server.edge";
import type { BundlerConfig, ImportManifestEntry } from "../../types";

// https://github.com/facebook/react/blob/c8a035036d0f257c514b3628e927dd9dd26e5a09/packages/react-server-dom-webpack/src/ReactFlightWebpackReferences.js#L43

// $$id: /src/components/counter.tsx#Counter
//   ⇕
// id: /src/components/counter.tsx
// name: Counter

export function registerClientReference(
  proxy: {},
  id: string,
  name: string,
): unknown {
  const reference = ReactServer.registerClientReference(proxy, id, name);
  return Object.defineProperties(
    {},
    {
      ...Object.getOwnPropertyDescriptors(reference),
      $$async: { value: true },
    },
  );
}

export function createBundlerConfig(): BundlerConfig {
  return new Proxy(
    {},
    {
      get(_target, $$id, _receiver) {
        tinyassert(typeof $$id === "string");
        let [id, name] = $$id.split("#");
        tinyassert(id);
        tinyassert(name);
        return { id, name, chunks: [] } satisfies ImportManifestEntry;
      },
    },
  );
}
