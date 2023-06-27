import type { LoaderFunction } from "react-router-dom";

// prefetch query using "equivalent" trpc caller query on server
export const loader: LoaderFunction = async ({ context }) => {
  const { queryClient, trpcCallerQ } = context;
  await queryClient.prefetchQuery(trpcCallerQ.getCounter.queryOptions());
  return null;
};
