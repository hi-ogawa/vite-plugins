import type { LoaderFunction } from "react-router-dom";
import { pokomenQueryOption } from "./server-data-utils";

// for the ease of tree-shake, employ explicit "page.server.ts" convention.
// for the ease of react-router integration, loader is used only during initial SSR and "loader data" is not passed to client.
// this very simplified architecture, however, allows mutating `queryClient` to implicitly pass data during SSR and hydration.
export const loader: LoaderFunction = async ({ context }) => {
  const { queryKey, queryFn } = pokomenQueryOption();
  await context.locals.queryClient.prefetchQuery(queryKey, queryFn);
  return null;
};
