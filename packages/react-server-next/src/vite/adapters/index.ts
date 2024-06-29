import type { Plugin } from "vite";

export type AdapterType = "node" | "vercel" | "cloudlare";

export function buildAdapterPlugin(options: {
  adapter?: AdapterType;
}): Plugin {
  const adapter = options.adapter ?? autoSelectAdapter();
  adapter;
  return {
    name: buildAdapterPlugin.name,
    enforce: "post",
    apply: (_config, env) => env.command === "build" && !env.isSsrBuild,
    async writeBundle() {},
  };
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
