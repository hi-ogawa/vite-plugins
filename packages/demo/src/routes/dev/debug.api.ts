import { RequestContext } from "@hattip/compose";
import { tinyassert } from "@hiogawa/utils";

// global "process.env" in vercel edge
// https://vercel.com/docs/concepts/functions/edge-functions/edge-runtime#environment-variables
declare let process: {
  env: unknown;
};

export function get(ctx: RequestContext) {
  const headers: [string, string][] = [];
  ctx.request.headers.forEach((v, k) => headers.push([k, v]));

  const data = {
    env: process.env,
    headers,
  };
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
