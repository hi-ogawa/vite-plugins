import type { Plugin } from "vite";

export type AdapterType = "node" | "vercel" | "cloudlare";

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
    apply: (_config, env) => env.command === "build" && !env.isSsrBuild,
    config(_config, _env) {
      return {
        build: {
          rollupOptions: {
            input: {
              // overwrite vitePluginSsrMiddleware's entry
              index: "@hiogawa/react-server/entry-server",
            },
          },
        },
      };
    },
    async writeBundle() {
      adapter;
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
    return "cloudlare";
  }
  return "node";
}
