import type { RequestContext } from "@hattip/compose";
import type {
  MutationObserverOptions,
  QueryObserverOptions,
} from "@tanstack/react-query";
import { z } from "zod";
import { sleep } from "../utils/misc";

//
// endpoint
//

export async function get() {
  return jsonResponse(await getCounter());
}

export async function put(ctx: RequestContext) {
  const delta = z.coerce.number().parse(ctx.url.searchParams.get("delta"));
  return jsonResponse(await updateCounter(delta));
}

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json",
    },
  });
}

//
// server counter
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

async function fetchJson(...args: Parameters<typeof fetch>): Promise<unknown> {
  const res = await fetch(...args);
  return res.json();
}

// SSR-enabled query
export function getCounterQueryOptions() {
  return {
    queryKey: ["getCounter"],
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
