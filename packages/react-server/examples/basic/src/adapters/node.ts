import { createMiddleware } from "@hattip/adapter-node/native-fetch";
import { handler } from "../entry-ssr";

export default createMiddleware((ctx) => handler(ctx.request));
