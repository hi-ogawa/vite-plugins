import { AsyncLocalStorage } from "node:async_hooks";
import type { RequestContext } from "@hattip/compose";
import { tinyassert } from "@hiogawa/utils";
import type { QueryClient } from "@tanstack/react-query";

export interface ServerContext {
  queryClient: QueryClient;
  requestContext: RequestContext;
}

export const serverContextStorage = new AsyncLocalStorage<ServerContext>();

export function getServerContext() {
  const store = serverContextStorage.getStore();
  tinyassert(store);
  return store;
}
