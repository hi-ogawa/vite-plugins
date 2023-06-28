import type { RequestContext } from "@hattip/compose";
import { tinyassert } from "@hiogawa/utils";
import type { QueryObserverOptions } from "@tanstack/react-query";
import { json, redirect } from "react-router-dom";
import { z } from "zod";
import { sleep } from "../../utils/misc";

//
// endpoint
//

export const Z_CHECK_OUTPUT = z.object({
  ok: z.boolean(),
  message: z.string(),
});

export type CheckOutput = z.infer<typeof Z_CHECK_OUTPUT>;

export async function get(ctx: RequestContext) {
  const id = ctx.url.searchParams.get("id") ?? "";
  const ok = await serverRedirectCheck(id);
  const data: CheckOutput = { ok, message: "api" };
  return json(data);
}

//
// server logic
//

export async function serverRedirectCheck(id: string): Promise<boolean> {
  await sleep(500);
  return id === "good";
}

export async function serverRedirectCheckSSR(id: string): Promise<CheckOutput> {
  const ok = await serverRedirectCheck(id);
  if (!ok) {
    throw redirect("/server-redirect?error=server");
  }
  return { ok, message: "ssr" };
}

//
// client
//

async function serverRedirectCheckClient(id: string) {
  const res = await fetch(`/server-redirect/check?id=${id}`);
  tinyassert(res.ok);
  return Z_CHECK_OUTPUT.parse(await res.json());
}

export function serverRedirectCheckQueryOptions(id: string) {
  return {
    queryKey: ["/server-redirect/check", id],
    queryFn: async () =>
      import.meta.env.SSR
        ? serverRedirectCheckSSR(id)
        : serverRedirectCheckClient(id),
    staleTime: Infinity,
  } satisfies QueryObserverOptions;
}
