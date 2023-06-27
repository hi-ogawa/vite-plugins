import type { LoaderFunction } from "react-router-dom";
import { getCounterQueryOptions } from "./server-data-counter.api";

// prefetch query
export const loader: LoaderFunction = async ({ context }) => {
  await context.queryClient.prefetchQuery(getCounterQueryOptions());
  return null;
};
