import { hc } from "hono/client";

export const rpc = hc<any>("/");
