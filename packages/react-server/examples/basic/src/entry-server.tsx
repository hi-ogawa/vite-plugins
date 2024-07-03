import {
  type ReactServerHandler,
  handler as baseHandler,
} from "@hiogawa/react-server/entry/server";

export const handler: ReactServerHandler = async (ctx) => {
  // custom handler example
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
