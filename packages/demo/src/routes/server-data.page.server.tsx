import type { LoaderFunction } from "react-router-dom";
import { getServerContext } from "../server/server-context";
import { getCounterQueryOptions } from "./server-data-counter.api";

export const loader: LoaderFunction = async () => {
  const { queryClient } = getServerContext();
  await queryClient.fetchQuery(getCounterQueryOptions());
  return null;
};
