import { tinyassert } from "@hiogawa/utils";
import type { QueryObserverOptions } from "@tanstack/react-query";
import { type LoaderFunction, redirect } from "react-router-dom";
import { sleep } from "../../utils/misc";

export const loader: LoaderFunction = async ({ params }) => {
  const id = params["id"]!;
  try {
    await dummyCheck(id);
    return null;
  } catch {
    throw redirect("/server-redirect?error=server");
  }
};

async function dummyCheck(id: string) {
  await sleep(1000);
  tinyassert(id === "good");
  return { message: "secret" };
}

export function dummyCheckQueryOptions(id: string) {
  return {
    queryKey: ["server-redirect-check", id],
    queryFn: async () => dummyCheck(id),
  } satisfies QueryObserverOptions;
}
