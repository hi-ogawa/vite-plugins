import type { RequestHandler } from "@hattip/compose";
import { json } from "react-router-dom";

export const get: RequestHandler = () => {
  return json({ message: "hello api" });
};

export const post: RequestHandler = async (ctx) => {
  const formData = await ctx.request.formData();
  const data: any = {};
  formData.forEach((v, k) => {
    data[k] = v;
  });
  return json({ method: ctx.request.method, message: "hello formData", data });
};
