import {
  type ReactServerHandler,
  handler as baseHandler,
} from "@hiogawa/react-server/entry-react-server";

console.log("[import]", import.meta.url);

export const handler: ReactServerHandler = async (ctx) => {
  const url = new URL(ctx.request.url);

  // custom handler example
  if (url.pathname === "/test/__rpc") {
    return new Response(JSON.stringify({ hello: "world" }), {
      headers: {
        "content-type": "application/json",
      },
    });
  }
  return baseHandler(ctx);
};
