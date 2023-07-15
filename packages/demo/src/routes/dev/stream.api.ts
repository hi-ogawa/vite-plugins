import type { RequestContext } from "@hattip/compose";
import { range, tinyassert } from "@hiogawa/utils";
import { z } from "zod";
import { sleep } from "../../utils/misc";

const Z_N = z.coerce.number().max(10).default(5);

export function get(ctx: RequestContext) {
  const n = Z_N.parse(ctx.url.searchParams.get("n") ?? undefined);

  const readableStream = new ReadableStream<string>({
    async start(controller) {
      controller.enqueue(`start streaming range(${n})\n`);
      for (const i of range(n)) {
        await sleep(500);
        controller.enqueue(`${i}\n`);
      }
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "content-type": "application/octet-stream",
    },
  });
}

// client
export async function fetchDevStream(): Promise<ReadableStream<string>> {
  const res = await fetch("/dev/stream");
  tinyassert(res.ok);
  tinyassert(res.body);
  return res.body.pipeThrough(new TextDecoderStream());
}
