import { name as packageName } from "../package.json";

const REGISTRY_KEY = Symbol.for(`${packageName}:registry`);

export interface ViteHot {
  data: {
    [REGISTRY_KEY]?: Registry;
  };
  accept: (onNewModule: (exports?: unknown) => void) => void;
  invalidate: (message?: string) => void;
}

interface Export {
  value: unknown;
  update: (next: unknown) => void;
}

interface Registry {
  exports: Record<string, Export>;
  // keep track of all exports of hot update history
  // since currently "writer" is responsible to keep old module up-to-date
  // where each old export could be used by other modules at any point in time
  // but this approach obviously leaks memory indefinitely
  // (alternative is to let "reader" be responsible for looking up latest module using proxy)
  history: Record<string, Export>[];
}

export function createRegistry(): Registry {
  const exports = {};
  return { exports, history: [exports] };
}

function patchRegistry(current: Registry, next: Registry): boolean {
  // replace all exports in history or full reload
  const keys = [
    ...new Set([...Object.keys(current.exports), ...Object.keys(next.exports)]),
  ];
  const mismatches = keys.filter(
    (key) => !(key in current.exports && key in next.exports)
  );
  if (mismatches.length > 0) {
    console.log("[simple-hmr] mismatch: ", mismatches.join(", "));
    return false;
  }
  for (const key of keys) {
    console.log("[simple-hmr]", key);
    for (const e of current.history) {
      e[key]!.update(next.exports[key]!.value);
    }
  }
  next.history = current.history;
  next.history.push(next.exports);
  return true;
}

export function setupHot(hot: ViteHot, registry: Registry) {
  hot.data[REGISTRY_KEY] = registry;

  hot.accept((newExports) => {
    const current = hot.data[REGISTRY_KEY];
    const ok = newExports && current && patchRegistry(registry, current);
    if (!ok) {
      hot.invalidate();
    }
  });
}
