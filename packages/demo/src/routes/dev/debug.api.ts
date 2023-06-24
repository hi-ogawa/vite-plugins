import { RequestContext } from "@hattip/compose";
import { tinyassert } from "@hiogawa/utils";

export function get(ctx: RequestContext) {
  const data = { ok: true, ctx: { url: { href: ctx.url.href } } };
  return new Response(JSON.stringify(data), {
    headers: [["content-type", "application/json"]],
  });
}

// client
export async function fetchDevDebug(): Promise<unknown> {
  const res = await fetch("/dev/debug");
  tinyassert(res.ok);
  return res.json();
}
