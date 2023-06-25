import type { RequestContext } from "@hattip/compose";
import { pokomenQueryOptionSSR } from "./server-data-utils";

// TODO: server callback convention
export async function onBeforeServerRender(ctx: RequestContext) {
  if (ctx.url.pathname !== "/server-data") return;

  const { queryKey, queryFn } = pokomenQueryOptionSSR();
  await ctx.locals.queryClient.prefetchQuery(queryKey, queryFn);
}
