import type nodeModule from "node:module";

export const createRequire: typeof nodeModule.createRequire = () => {
  return new Proxy(() => {}, {
    get(_target, p, _receiver) {
      throw new Error(`todo: createRequire - ${String(p)}`);
    },
  }) as any;
};

export const builtinModules = [];
