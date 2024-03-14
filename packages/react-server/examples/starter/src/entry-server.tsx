import { handler as baseHandler } from "@hiogawa/react-server/entry-server";

// for example, wrap with a simple logger
export const handler: typeof baseHandler = async (req) => {
  const url = new URL(req.url);
  console.log("-->", req.method, url.pathname);

  const res = await baseHandler(req);

  console.log("<--", req.method, url.pathname, res.status);
  return res;
};
