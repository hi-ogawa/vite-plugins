import { tinyassert } from "@hiogawa/utils";
import type { ImportManifestEntry, ModuleMap } from "./types";

export const moduleMap: ModuleMap = new Proxy(
  {},
  {
    get(_target, id, _receiver) {
      return new Proxy(
        {},
        {
          get(_target, name, _receiver) {
            console.log("[moduleMap]", { id, name });
            tinyassert(typeof id === "string");
            tinyassert(typeof name === "string");
            return {
              id,
              name,
              chunks: [],
            } satisfies ImportManifestEntry;
          },
        }
      );
    },
  }
);
