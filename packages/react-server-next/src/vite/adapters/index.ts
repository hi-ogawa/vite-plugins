import type { Plugin } from "vite";

export type AdapterType = "node" | "vercel" | "vercel-edge" | "cloudflare";

export function adapterPlugin(options: {
  adapter: AdapterType;
  outDir: string;
}): Plugin[] {
  const adapter = options.adapter ?? autoSelectAdapter();
  if (adapter === "node") {
    return [];
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

  return [registerHooksPlugin, buildPlugin];
}

// cf. https://github.com/sveltejs/kit/blob/52e5461b055a104694f276859a7104f58452fab0/packages/adapter-auto/adapters.js
export function autoSelectAdapter(): AdapterType {
  if (process.env["VERCEL"]) {
    return "vercel";
  }
  if (process.env["CF_PAGES"]) {
    return "cloudflare";
  }
  return "node";
}
