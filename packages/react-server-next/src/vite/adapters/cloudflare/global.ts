import type { AsyncLocalStorage } from "async_hooks";

export const $cloudflare: {
  storage: AsyncLocalStorage<any>;
  platformProxy: any;
} = ((globalThis as any).__REACT_SERVER_CLOUDFLARE_GLOBAL ??= {});
