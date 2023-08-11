import type { RequestHandler } from "@hattip/compose";
import { json } from "react-router-dom";

export const get: RequestHandler = () => {
  return json({ message: "hello api" });
};
