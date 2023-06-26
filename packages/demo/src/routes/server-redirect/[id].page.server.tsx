import { tinyassert } from "@hiogawa/utils";
import type { QueryObserverOptions } from "@tanstack/react-query";
import { type LoaderFunction, redirect } from "react-router-dom";
import { sleep } from "../../utils/misc";

export const loader: LoaderFunction = async ({ params, context }) => {
  const id = params["id"]!;
  try {
    // note that `prefetchQuery(...queryFn)` would swallow errors from `queryFn`
    // so here the logic is a little convoluted
    await dummyCheck(id);
    context.locals.queryClient.setQueryData(
      dummyCheckQueryOptions(id).queryKey,
      { message: "success on server!" }
    );
    return null;
  } catch {
    throw redirect("/server-redirect?error=server");
  }
};

async function dummyCheck(id: string) {
  await sleep(1000);
  tinyassert(id === "good");
}

export function dummyCheckQueryOptions(id: string) {
  return {
    queryKey: ["server-redirect-check", id],
    queryFn: async () => {
      await dummyCheck(id);
      return { message: "success on client!" };
    },
  } satisfies QueryObserverOptions;
}
