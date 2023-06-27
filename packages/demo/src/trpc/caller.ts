import { createTrpcContext } from "./init";
import { trpcRouter } from "./router";

// expose trpc caller for server loader

export type TrpcCaller = Awaited<ReturnType<typeof createTrpcCaller>>;

export async function createTrpcCaller({ request }: { request: Request }) {
  const trpcCtx = await createTrpcContext({
    req: request,
    resHeaders: new Headers(), // not used
  });
  return trpcRouter.createCaller(trpcCtx);
}
