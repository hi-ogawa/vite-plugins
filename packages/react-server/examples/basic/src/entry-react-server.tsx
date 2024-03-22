import * as clientInternal from "@hiogawa/react-server/client-internal";
import {
  type ReactServerHandler,
  handler as baseHandler,
} from "@hiogawa/react-server/entry-react-server";
import { __global } from "@hiogawa/react-server/internal";

export const handler: ReactServerHandler = async (ctx) => {
  __global.clientInternal = clientInternal;

  const url = new URL(ctx.request.url);
  if (url.pathname === "/test/__rpc") {
    return new Response(JSON.stringify({ hello: "world" }), {
      headers: {
        "content-type": "application/json",
      },
    });
  }
  return baseHandler(ctx);
};
