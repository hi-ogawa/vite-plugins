import {
  type ReactServerHandler,
  handler as baseHandler,
} from "@hiogawa/react-server/entry-react-server";

export const handler: ReactServerHandler = async (ctx) => {
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
