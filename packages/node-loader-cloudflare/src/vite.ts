import type { Plugin } from "vite";
import { registerCloudflare } from ".";

// TODO: configFile options etc.

export default function nodeLoaderCloudflarePlugin(): Plugin[] {
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
      configEnvironment() {
        return {
          resolve: {
            builtins: [/^cloudflare:/],
          },
        };
      },
      async buildStart() {
        if (!registerPromise) {
          console.log("[node-loader-cloudflare] registering...");
          registerPromise = registerCloudflare();
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
