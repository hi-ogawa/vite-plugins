import type { Plugin } from "vite";
import { registerCloudflare } from ".";

export default function nodeLoaderCloudflarePlugin(): Plugin[] {
  let deregister: (() => Promise<void>) | undefined;

  return [
    {
      name: "node-loader-cloudflare",
      configEnvironment() {
        return {
          resolve: {
            builtins: [/^cloudflare:/],
          },
        };
      },
      async buildStart() {
        deregister ??= await registerCloudflare();
      },
      async buildEnd() {
        if (this.environment.mode === "dev") {
          await deregister?.();
          deregister = undefined;
        }
      },
      buildApp: {
        order: "post",
        async handler() {
          await deregister?.();
          deregister = undefined;
        },
      },
    },
  ];
}
