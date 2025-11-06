import * as nodeModule from "node:module";
import { type GetPlatformProxyOptions, getPlatformProxy } from "wrangler";

// use node custom loader to implement "cloudflare:workers"
export async function registerCloudflare(registerOptions?: {
  options?: GetPlatformProxyOptions;
  exposeGlobals?: boolean;
}): Promise<() => Promise<void>> {
  const { options, exposeGlobals } = registerOptions ?? {};
  const platformProxy = await getPlatformProxy(options);
  (globalThis as any).__node_loader_cloudflare_platform_proxy = platformProxy;

  if (exposeGlobals) {
    if (!(globalThis as any).caches) {
      Object.assign(globalThis, {
        caches: platformProxy.caches,
      });
    }
    try {
      const miniflare = await import("miniflare");
      Object.assign(globalThis, { WebSocketPair: miniflare.WebSocketPair });
    } catch {}
  }

  const resolveFn: nodeModule.ResolveHook = async function (
    specifier,
    context,
    nextResolve,
  ) {
    if (specifier === "cloudflare:workers") {
      return {
        shortCircuit: true,
        url: specifier,
      };
    }
    return nextResolve(specifier, context);
  };

  const loadFn: nodeModule.LoadHook = async function (url, context, nextLoad) {
    if (url === "cloudflare:workers") {
      return {
        shortCircuit: true,
        format: "module",
        source: `\
export const env = globalThis.__node_loader_cloudflare_platform_proxy.env;

const __ctx = globalThis.__node_loader_cloudflare_platform_proxy.ctx;
export const waitUntil = __ctx.waitUntil.bind(__ctx);
`,
      };
    }
    return nextLoad(url, context);
  };

  // TODO: sync hooks if availble
  nodeModule.register(`data:text/javascript,
export const resolve = ${resolveFn.toString()};
export const load = ${loadFn.toString()};    
`);

  return async () => {
    await platformProxy.dispose();
  };
}
