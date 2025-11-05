import * as nodeModule from "node:module";
import { getPlatformProxy } from "wrangler";

// use node custom loader to implement "cloudflare:workers"
export async function registerCloudflare(): Promise<() => Promise<void>> {
  const platformProxy = await getPlatformProxy();
  (globalThis as any).__node_loader_cloudflare_platform_proxy = platformProxy;

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
