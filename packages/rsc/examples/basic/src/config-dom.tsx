import type { ModuleMap } from "./react-types";

export const devModuleMap: ModuleMap = new Proxy(
  {},
  {
    get(_target, id, _receiver) {
      console.log("[moduleMap]", { id });
      return new Proxy(
        {},
        {
          get(_target, name, _receiver) {
            console.log("[moduleMap]", { id, name });
            return {
              id,
              name,
              chunks: [],
            };
          },
        }
      );
    },
  }
);
