import { tinyassert } from "@hiogawa/utils";
import type { BundlerConfig } from "./react-types";

// TODO: build?

// bundler id: /src/components/counter.tsx::Counter
//   ⇓
// id: /src/components/counter.tsx
// name: Counter

export const myBundlerConfig: BundlerConfig = new Proxy(
  {},
  {
    get(_target, p, _receiver) {
      console.log("[bundlerConfig]", { p });
      tinyassert(typeof p === "string");
      const [id, name] = p.split("::");
      tinyassert(id);
      tinyassert(name);
      return { id, name, chunks: [] };
    },
  }
);
