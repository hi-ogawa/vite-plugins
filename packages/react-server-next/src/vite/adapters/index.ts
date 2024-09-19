import type { Plugin } from "vite";
import { $cloudflare } from "./cloudflare/global";

export type AdapterType = "node" | "vercel" | "vercel-edge" | "cloudflare";

export function adapterPlugin(options: {
  adapter: AdapterType;
  outDir: string;
}): [Plugin[], Plugin[]] {
  const adapter = options.adapter ?? autoSelectAdapter();
  if (adapter === "node") {
    return [[], []];
  }

  const buildPlugin: Plugin = {
    name: adapterPlugin.name + ":build",
    enforce: "post",
    apply: (_config, env) => !!env.isSsrBuild,
    config() {
      return {
        build: {
          rollupOptions: {
            input: {
              index: `next/vite/adapters/${adapter}/entry`,
            },
          },
        },
      };
    },
    writeBundle: {
      sequential: true,
      async handler() {
        console.log(`▶▶▶ ADAPTER: ${adapter}`);
        if (adapter === "cloudflare") {
          const { build } = await import("./cloudflare/build");
          await build({ outDir: options.outDir });
        }
        if (adapter === "vercel") {
          const { build } = await import("./vercel/build");
          await build({ runtime: "node", outDir: options.outDir });
        }
        if (adapter === "vercel-edge") {
          const { build } = await import("./vercel/build");
          await build({ runtime: "edge", outDir: options.outDir });
        }
      },
    },
  };

  const registerHooksPlugin: Plugin = {
    name: adapterPlugin.name + ":register-hooks",
    enforce: "pre",
    writeBundle: {
      sequential: true,
      async handler() {
        // allow importing ".bin" and ".wasm" to simulate CF runtime
        // during pre-rendering
        if (adapter === "cloudflare" || adapter === "vercel-edge") {
          const {
            default: { register },
          } = await import("node:module");
          register(
            "@hiogawa/vite-plugin-server-asset/hooks/data",
            import.meta.url,
          );
          register(
            "@hiogawa/vite-plugin-server-asset/hooks/wasm",
            import.meta.url,
          );
        }
      },
    },
  };

  const devPlatformPlugin: Plugin = {
    name: adapterPlugin.name + ":dev-platform",
    apply: "serve",
    async buildStart() {
      if (adapter === "cloudflare") {
        // TODO: support options
        const { getPlatformProxy } = await import("wrangler");
        $cloudflare.platformProxy = await getPlatformProxy({ persist: true });
      }
    },
    async buildEnd() {
      if (adapter === "cloudflare") {
        await $cloudflare.platformProxy.dispose();
      }
    },
  };

  const aliasPlatformPlugin: Plugin = {
    name: adapterPlugin.name + ":alias-platform",
    config() {
      return {
        resolve: {
          alias: {
            "next/vite/platform": `next/vite/adapters/${adapter}/platform`,
          },
        },
      };
    },
  };

  return [
    [registerHooksPlugin, buildPlugin, devPlatformPlugin],
    [aliasPlatformPlugin],
  ];
}

// cf. https://github.com/sveltejs/kit/blob/52e5461b055a104694f276859a7104f58452fab0/packages/adapter-auto/adapters.js
export function autoSelectAdapter(): AdapterType {
  if (process.env["ADAPTER"]) {
    return process.env["ADAPTER"] as any;
  }
  if (process.env["VERCEL"]) {
    return "vercel";
  }
  if (process.env["CF_PAGES"]) {
    return "cloudflare";
  }
  return "node";
}
