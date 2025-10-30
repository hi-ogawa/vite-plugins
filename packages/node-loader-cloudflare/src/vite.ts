import type { Plugin } from "vite";
import { registerCloudflare } from ".";

export default function nodeLoaderCloudflarePlugin(): Plugin[] {
  let deregister: (() => Promise<void>) | undefined;
  return [
    {
      name: "node-loader-cloudflare",
      async buildStart() {
        deregister ??= await registerCloudflare();
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
