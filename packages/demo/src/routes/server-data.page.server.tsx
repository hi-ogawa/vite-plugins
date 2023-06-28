import type { LoaderFunction } from "react-router-dom";
import { getCounterQueryOptions } from "./server-data-counter.api";

export const loader: LoaderFunction = async ({ context }) => {
  await context.queryClient.fetchQuery(getCounterQueryOptions());
  return null;
};
