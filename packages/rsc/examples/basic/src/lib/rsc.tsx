import { tinyassert } from "@hiogawa/utils";
import { wrapRenderId } from "./shared";
import type { BundlerConfig, ImportManifestEntry } from "./types";

// cf.
// https://github.com/lazarv/react-server/blob/2ff6105e594666065be206729858ecfed6f5e8d8/packages/react-server/client/components.mjs#L15-L25

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

// renderId: xxx (only used for dev)
// $$id: /src/components/counter.tsx::Counter
//   ⇕
// id: /src/components/counter.tsx?__renderId=xxx
// name: Counter
export function createBundlerConfig({
  renderId,
}: {
  renderId: string;
}): BundlerConfig {
  return new Proxy(
    {},
    {
      get(_target, $$id, _receiver) {
        tinyassert(typeof $$id === "string");
        let [id, name] = $$id.split("::");
        tinyassert(id);
        tinyassert(name);
        id = wrapRenderId(id, renderId);
        return { id, name, chunks: [] } satisfies ImportManifestEntry;
      },
    }
  );
}
