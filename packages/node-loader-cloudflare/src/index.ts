import * as nodeModule from "node:module";
import { type GetPlatformProxyOptions, getPlatformProxy } from "wrangler";

// use node custom loader to implement "cloudflare:workers"
export async function registerCloudflare(
  options?: GetPlatformProxyOptions,
  exposeGlobals?: boolean,
): Promise<() => Promise<void>> {
  const platformProxy = await getPlatformProxy(options);
  (globalThis as any).__node_loader_cloudflare_platform_proxy = platformProxy;

  // Expose globals to globalThis if requested
  if (exposeGlobals) {
    // Expose caches from platformProxy
    Object.assign(globalThis, {
      caches: platformProxy.caches,
    });

    // Dynamically import miniflare and expose WebSocketPair
    try {
      // @ts-expect-error - miniflare is an optional transitive dependency of wrangler
      const miniflare = await import("miniflare");
      if (miniflare.WebSocketPair) {
        Object.assign(globalThis, { WebSocketPair: miniflare.WebSocketPair });
      }
    } catch (error) {
      console.warn(
        "[node-loader-cloudflare] Failed to import WebSocketPair from miniflare:",
        error,
      );
    }
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
        // TODO: more API? waitUntil
        source: `\
export const env = globalThis.__node_loader_cloudflare_platform_proxy.env;
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
