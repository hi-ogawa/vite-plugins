import type { Plugin } from "vite";

export type AdapterType = "node" | "vercel" | "vercel-edge" | "cloudflare";

export function adapterPlugin(options: {
  adapter?: AdapterType;
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
          await build();
        }
        if (adapter === "vercel") {
          const { build } = await import("./vercel/build");
          await build({ runtime: "node" });
        }
        if (adapter === "vercel-edge") {
          const { build } = await import("./vercel/build");
          await build({ runtime: "edge" });
        }
      },
    },
  };

  return [buildPlugin];
}

// cf. https://github.com/sveltejs/kit/blob/52e5461b055a104694f276859a7104f58452fab0/packages/adapter-auto/adapters.js
function autoSelectAdapter(): AdapterType {
  if (process.env["VERCEL"]) {
    return "vercel";
  }
  if (process.env["CF_PAGES"]) {
    return "cloudflare";
  }
  return "node";
}
