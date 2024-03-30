import util from "node:util";
import type { RequestHandler } from "@hattip/compose";
import { json } from "react-router-dom";

export const get: RequestHandler = () => {
  return json({ format: util.format("hello:%s", "world") });
};
