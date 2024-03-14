import { tinyassert } from "@hiogawa/utils";
import type { BundlerConfig, ImportManifestEntry } from "./types";

// TODO: apply same noramlizaion as Vite to avoid dual package with "/xyz" and "/@fs/xyz"
// https://github.com/vitejs/vite/blob/0c0aeaeb3f12d2cdc3c47557da209416c8d48fb7/packages/vite/src/node/plugins/importAnalysis.ts#L327-L399

// https://github.com/lazarv/react-server/blob/2ff6105e594666065be206729858ecfed6f5e8d8/packages/react-server/client/components.mjs#L15-L25
// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightWebpackReferences.js#L48
export function createClientReference(id: string): React.FC {
  return Object.defineProperties(() => {}, {
    $$typeof: {
      value: Symbol.for("react.client.reference"),
      enumerable: true,
    },
    $$id: {
      value: id,
      enumerable: true,
    },
    $$async: {
      value: true,
      enumerable: true,
    },
  }) as any;
}

// $$id: /src/components/counter.tsx::Counter
//   ⇕
// id: /src/components/counter.tsx
// name: Counter
export function createBundlerConfig(): BundlerConfig {
  return new Proxy(
    {},
    {
      get(_target, $$id, _receiver) {
        tinyassert(typeof $$id === "string");
        let [id, name] = $$id.split("::");
        tinyassert(id);
        tinyassert(name);
        return { id, name, chunks: [] } satisfies ImportManifestEntry;
      },
    }
  );
}
