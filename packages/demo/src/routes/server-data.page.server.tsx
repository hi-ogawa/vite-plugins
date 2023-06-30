import type { LoaderFunction } from "react-router-dom";
import { getServerContext } from "../server/server-context";
import { trpcCallerQuery } from "../trpc/router";

export const loader: LoaderFunction = async () => {
  const { queryClient } = getServerContext();
  await queryClient.fetchQuery(trpcCallerQuery.getCounter.queryOptions());
  return null;
};
