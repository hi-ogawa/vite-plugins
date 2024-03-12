import { createMiddleware } from "@hattip/adapter-node/native-fetch";
import { handler } from "../entry-server";

export default createMiddleware((ctx) => handler(ctx.request));
