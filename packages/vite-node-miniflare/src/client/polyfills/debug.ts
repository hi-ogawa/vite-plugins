// patch `debug` package for vite-node/client
// https://github.com/vitest-dev/vitest/blob/9c552b6f8decb78677b20e870eb430184e0b78ea/packages/vite-node/src/client.ts#L15-L16
// https://github.com/debug-js/debug/blob/f66cb2d9f729e1a592e72d3698e3b75329d75a25/src/browser.js#L219C7-L219C39

export let __debug = false;

export function __setDebug(v: boolean) {
  __debug = v;
}

export default function createDebug(namespace: string) {
  return function log(...args: string[]) {
    if (__debug) {
      console.log(`[${namespace}]`, ...args);
    }
  };
}
