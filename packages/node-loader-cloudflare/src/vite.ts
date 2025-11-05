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
   * Options to pass to `getPlatformProxy` from `wrangler`.
   */
  options?: GetPlatformProxyOptions;
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

  return [
    {
      name: "node-loader-cloudflare",
      sharedDuringBuild: true,
      configEnvironment(_name, config) {
        return {
          resolve: {
            // TODO: doesn't merge?
            builtins: [
              /^cloudflare:/,
              ...config.resolve?.builtins ?? []
            ],
          },
        };
      },
      async buildStart() {
        if (this.environment.mode === "build" && !pluginOpts?.build) {
          return;
        }
        if (!registerPromise) {
          console.log("[node-loader-cloudflare] registering...");
          registerPromise = registerCloudflare(pluginOpts?.options);
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
