// for now, we don't require async hooks and fallbacks to sync context
// if it's not availalbe globally like React.cache.

import { tinyassert } from "@hiogawa/utils";

export type ContextStorage<T> = {
  run<R>(store: T, callback: () => R): R;
  getStore(): T | undefined;
};

export function createStorage<T>(): ContextStorage<T> {
  if ((globalThis as any).AsyncLocalStorage) {
    return new (globalThis as any).AsyncLocalStorage();
  }
  return createSyncStorage();
}

function createSyncStorage<T>(): ContextStorage<T> {
  let current: T | undefined;
  return {
    run(store, callback) {
      tinyassert(!current);
      current = store;
      const result = callback();
      current = undefined;
      return result;
    },
    getStore() {
      return current;
    },
  };
}
