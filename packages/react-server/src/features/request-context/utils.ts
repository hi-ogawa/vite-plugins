// for now, we don't require async hooks and fallbacks to sync context
// if it's not availalbe globally like React.cache.
// https://github.com/facebook/react/blob/f14d7f0d2597ea25da12bcf97772e8803f2a394c/packages/react-server/src/forks/ReactFlightServerConfig.dom-edge.js#L16-L19

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
