import { createMiddleware } from "@hattip/adapter-node";
import { handler } from "../entry-server";

export default createMiddleware((ctx) => handler(ctx.request));
