import type { RequestContext } from "@hattip/compose";
import { json } from "react-router-dom";
import { z } from "zod";
import { fetchJson, sleep } from "../utils/misc";

export async function get() {
  await sleep(200);
  return json(getCounter());
}

export async function put(ctx: RequestContext) {
  await sleep(200);
  const delta = z.coerce.number().parse(ctx.url.searchParams.get("delta"));
  return json(await updateCounter(delta));
}

let counter = 0;

export const getCounter = () => counter;

async function updateCounter(delta: number) {
  counter += delta;
  return counter;
}

//
// client
//

export async function updateCounterClient(delta: number) {
  return fetchJson(`/loader-data-counter?delta=${delta}`, {
    method: "PUT",
  }).then(z.number().parse);
}
