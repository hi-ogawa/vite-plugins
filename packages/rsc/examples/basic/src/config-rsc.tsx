import { tinyassert } from "@hiogawa/utils";
import type { BundlerConfig, ImportManifestEntry } from "./react-types";

// TODO: build?

// bundler id: /src/components/counter.tsx::Counter
//   ⇓
// id: /src/components/counter.tsx
// name: Counter

export const devBundlerConfig: BundlerConfig = new Proxy(
  {},
  {
    get(_target, $$id, _receiver) {
      console.log("[bundlerConfig]", { $$id });
      tinyassert(typeof $$id === "string");
      const [id, name] = $$id.split("::");
      tinyassert(id);
      tinyassert(name);
      return { id, name, chunks: [] } satisfies ImportManifestEntry;
    },
  }
);
