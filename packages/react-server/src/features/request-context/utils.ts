// we don't require async hooks and fallbacks to sync context
// (see virtual:inject-async-local-storage)

type ContextStorage<T> = {
  run<R>(store: T, callback: () => R): R;
  getStore(): T | undefined;
};

export function createContextStorage<T>(): ContextStorage<T> {
  if ((globalThis as any).AsyncLocalStorage) {
    return new (globalThis as any).AsyncLocalStorage();
  }
  return createSyncStorage();
}

function createSyncStorage<T>(): ContextStorage<T> {
  let current: T | undefined;
  return {
    run(store, callback) {
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
