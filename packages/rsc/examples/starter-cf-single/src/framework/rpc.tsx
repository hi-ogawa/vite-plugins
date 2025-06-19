import { tinyassert } from "@hiogawa/utils";
import { decode, encode } from "turbo-stream";

type RequestPayload = {
  method: string;
  args: any[];
};

type ResponsePayload = {
  ok: boolean;
  data: any;
};

export function createRpcServer<T extends object>(handlers: T) {
  return async (request: Request) => {
    tinyassert(request.body);
    const reqPayload = await decode<RequestPayload>(
      request.body.pipeThrough(new TextDecoderStream()),
    );
    console.log("[rpc-server]", { reqPayload });
    const handler = (handlers as any)[reqPayload.method];
    tinyassert(handler);
    const resPayload: ResponsePayload = { ok: true, data: undefined };
    try {
      resPayload.data = await handler(...reqPayload.args);
    } catch (e) {
      resPayload.ok = false;
      resPayload.data = e;
    }
    return new Response(encode(resPayload));
  };
}

export function createRpcClient<T>(options: { endpoint: string }): T {
  async function callRpc(method: string, args: any[]) {
    const reqPayload: RequestPayload = {
      method,
      args,
    };
    console.log("[rpc-client]", { reqPayload });
    const res = await fetch(options.endpoint, {
      method: "POST",
      body: encode(reqPayload),
    });
    tinyassert(res.ok);
    tinyassert(res.body);
    const resPayload = await decode<ResponsePayload>(
      res.body.pipeThrough(new TextDecoderStream()),
    );
    if (!resPayload.ok) {
      throw resPayload.data;
    }
    return resPayload.data;
  }

  return new Proxy(
    {},
    {
      get(_target, p, _receiver) {
        if (typeof p !== "string" || p === "then") {
          return;
        }
        return (...args: any[]) => callRpc(p, args);
      },
    },
  ) as any;
}
