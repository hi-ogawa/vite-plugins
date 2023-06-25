import { createMiddleware } from "@hattip/adapter-node";
import { createHattipApp } from ".";

export default createMiddleware(createHattipApp(), { trustProxy: true });
