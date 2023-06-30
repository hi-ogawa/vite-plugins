import { z } from "zod";

export const Z_TINY_RPC_REQUEST = z.object({
  path: z.string(),
  input: z.unknown(),
});

export type TinyRpcRequest = z.infer<typeof Z_TINY_RPC_REQUEST>;

export const Z_TINY_RPC_RESPONSE = z.object({
  output: z.unknown(),
});

export type TinyRpcResponse = z.infer<typeof Z_TINY_RPC_RESPONSE>;
