import type { LoaderFunction } from "react-router-dom";
import { pokomenQueryOptionSSR } from "./server-data-utils";

// for the ease (i.e. no need) of tree-shake, employ explicit "page.server.ts" convention.
// for the ease of integration, loader is used only during initial SSR.
export const loader: LoaderFunction = async ({ context }) => {
  const { queryKey, queryFn } = pokomenQueryOptionSSR();
  await context.locals.queryClient.prefetchQuery(queryKey, queryFn);
  return null;
};
