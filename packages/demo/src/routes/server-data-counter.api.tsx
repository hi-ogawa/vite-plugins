import type { RequestContext } from "@hattip/compose";
import type {
  MutationObserverOptions,
  QueryObserverOptions,
} from "@tanstack/react-query";
import { json } from "react-router-dom";
import { z } from "zod";
import { fetchJson, sleep } from "../utils/misc";

// Note that the logic here to achieve "ssr-prefetchable" data loading may look too verbose,
// but it could be greatly simplified and organized by relying on data fetching layer,
// which provides somewhat "uniform" way of treating "client-side" fetching and "server-side" loading.
// See this proof-of-concept PR which uses tRPC https://github.com/hi-ogawa/vite-plugins/pull/30

//
// endpoint
//

export async function get() {
  return json(await getCounter());
}

export async function put(ctx: RequestContext) {
  const delta = z.coerce.number().parse(ctx.url.searchParams.get("delta"));
  return json(await updateCounter(delta));
}

//
// server logic
//

let counter = 0;

async function getCounter() {
  await sleep(500);
  return counter;
}

async function updateCounter(delta: number) {
  await sleep(500);
  counter += delta;
  return counter;
}

//
// client
//

async function getCounterClient(): Promise<number> {
  return fetchJson("/server-data-counter").then(z.number().parse);
}

async function updateCounterClient(delta: number) {
  return fetchJson(`/server-data-counter?delta=${delta}`, {
    method: "PUT",
  }).then(z.number().parse);
}

export function getCounterQueryOptions() {
  return {
    queryKey: ["getCounter"],
    // SSR-enabled query
    queryFn: async () =>
      import.meta.env.SSR ? getCounter() : getCounterClient(),
  } satisfies QueryObserverOptions;
}

export function updateCounterMutationOptions() {
  return {
    mutationKey: ["updateCounter"],
    mutationFn: updateCounterClient,
  } satisfies MutationObserverOptions<any, any, any, any>;
}
