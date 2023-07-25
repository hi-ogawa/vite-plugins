import type { RequestHandler } from "@hattip/compose";
import { json } from "react-router-dom";

export const get: RequestHandler = (ctx) => {
  return json({ params: ctx.params });
};
