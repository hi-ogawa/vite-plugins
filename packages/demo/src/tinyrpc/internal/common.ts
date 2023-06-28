import type { RequestContext } from "@hattip/compose";
import { z } from "zod";

export type TinyRpcProcedure = (arg: {
  input: any;
  ctx: RequestContext;
}) => Promise<any>;

export type TinyRpcRoutesBase = Record<string, TinyRpcProcedure>;

export type TinyRpcProxy<R extends TinyRpcRoutesBase> = {
  [K in keyof R]: (
    input: Parameters<R[K]> extends [{ input: infer I }] ? I : void
  ) => ReturnType<R[K]>;
};

export const Z_TINY_RPC_REQUEST = z.object({
  path: z.string(),
  input: z.unknown(),
});

export type TinyRpcRequest = z.infer<typeof Z_TINY_RPC_REQUEST>;

export const Z_TINY_RPC_RESPONSE = z.object({
  data: z.unknown(),
});

export type TinyRpcResponse = z.infer<typeof Z_TINY_RPC_RESPONSE>;
