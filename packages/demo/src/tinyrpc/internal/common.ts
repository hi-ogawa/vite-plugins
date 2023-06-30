import { z } from "zod";

// TODO:
// - support GET
// - error convention

export const Z_TINY_RPC_REQUEST = z.object({
  input: z.unknown(),
});

export type TinyRpcRequest = z.infer<typeof Z_TINY_RPC_REQUEST>;

export const Z_TINY_RPC_RESPONSE = z.object({
  output: z.unknown(),
});

export type TinyRpcResponse = z.infer<typeof Z_TINY_RPC_RESPONSE>;
