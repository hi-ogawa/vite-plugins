import { builtinModules } from "node:module";
import type { Plugin } from "vite";
import type { GetPlatformProxyOptions } from "wrangler";
import { registerCloudflare } from ".";

export interface NodeLoaderCloudflarePluginOptions {
  /**
   * Whether to enable the plugin during build time for SSG etc.
   * @default false
   */
  build?: boolean;
  /**
   * @default ["ssr"]
   */
  environments?: string[];
  /**
   * Options to pass to `getPlatformProxy` from `wrangler`.
   */
  options?: GetPlatformProxyOptions;
  /**
   * Whether to expose Cloudflare globals like `WebSocketPair` and `caches` to globalThis.
   * @default false
   */
  exposeGlobals?: boolean;
}

export default function nodeLoaderCloudflarePlugin(
  pluginOpts?: NodeLoaderCloudflarePluginOptions,
): Plugin[] {
  let registerPromise: Promise<() => Promise<void>> | undefined;
  async function deregister() {
    if (registerPromise) {
      console.log("[node-loader-cloudflare] deregistering...");
      let promise = registerPromise;
      registerPromise = undefined;
      await (await promise)();
    }
  }

  const resolvedPluginOpts: Required<NodeLoaderCloudflarePluginOptions> = {
    build: pluginOpts?.build ?? false,
    environments: pluginOpts?.environments ?? ["ssr"],
    options: pluginOpts?.options ?? {},
    exposeGlobals: pluginOpts?.exposeGlobals ?? false,
  };

  return [
    {
      name: "node-loader-cloudflare",
      sharedDuringBuild: true,
      configEnvironment(name) {
        if (resolvedPluginOpts.environments.includes(name)) {
          return {
            resolve: {
              builtins: [/^cloudflare:/, ...nodeLikeBuiltins],
            },
          };
        }
      },
      async buildStart() {
        if (this.environment.mode === "build" && !resolvedPluginOpts.build) {
          return;
        }
        if (!registerPromise) {
          console.log("[node-loader-cloudflare] registering...");
          registerPromise = registerCloudflare(
            resolvedPluginOpts.options,
            resolvedPluginOpts.exposeGlobals,
          );
        }
        await registerPromise;
      },
      async buildEnd() {
        if (this.environment.mode === "dev") {
          await deregister();
        }
      },
      buildApp: {
        order: "post",
        async handler() {
          await deregister();
        },
      },
    },
  ];
}

// copied from
// https://github.com/vitejs/vite/blob/2833c5576a87be2db450c195ccf64dfc8925a15b/packages/vite/src/node/utils.ts#L121

// Supported by Node, Deno, Bun
const NODE_BUILTIN_NAMESPACE = "node:";
// Supported by Bun
const BUN_BUILTIN_NAMESPACE = "bun:";
// Some runtimes like Bun injects namespaced modules here, which is not a node builtin
const nodeBuiltins = builtinModules.filter((id) => !id.includes(":"));

const nodeLikeBuiltins: (string | RegExp)[] = [
  ...nodeBuiltins,
  new RegExp(`^${NODE_BUILTIN_NAMESPACE}`),
  new RegExp(`^${BUN_BUILTIN_NAMESPACE}`),
];
