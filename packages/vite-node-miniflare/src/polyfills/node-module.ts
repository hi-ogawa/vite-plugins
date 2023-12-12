import type nodeModule from "node:module";

export const createRequire: typeof nodeModule.createRequire = () => {
  return new Proxy(() => {}, {
    get(target, p, receiver) {
      throw new Error(`todo: createRequire - ${String(p)}`);
    },
  }) as any;
};

export const builtinModules = [];
