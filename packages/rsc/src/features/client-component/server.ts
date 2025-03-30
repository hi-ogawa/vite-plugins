import { tinyassert } from "@hiogawa/utils";
import type { BundlerConfig, ImportManifestEntry } from "../../types";

export function createBundlerConfig(): BundlerConfig {
  return new Proxy(
    {},
    {
      get(_target, $$id, _receiver) {
        tinyassert(typeof $$id === "string");
        let [id, name] = $$id.split("#");
        tinyassert(id);
        tinyassert(name);
        return {
          id,
          name,
          // TODO: preinit not working?
          // `ReactDOMSharedInternals.d.X` seems no-op due to null request context?
          chunks: [id, id],
          async: true,
        } satisfies ImportManifestEntry;
      },
    },
  );
}
