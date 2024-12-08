import {
  type DevEnvironment,
  type EnvironmentModuleNode,
  isCSSRequest,
} from "vite";

// cf
// https://github.com/hi-ogawa/vite-plugins/blob/3c496fa1bb5ac66d2880986877a37ed262f1d2a6/packages/vite-glob-routes/examples/demo/vite-plugin-ssr-css.ts
// https://github.com/remix-run/remix/blob/dev/packages/remix-dev/vite/styles.ts

export async function transformStyleUrls(
  server: DevEnvironment,
  urls: string[],
) {
  const styles = await Promise.all(
    urls.map(async (url) => {
      const res = await server.transformRequest(url + "?direct");
      return res?.code;
    }),
  );
  return styles.filter(Boolean).join("\n\n");
}

export async function collectStyleUrls(
  server: DevEnvironment,
  { entries }: { entries: string[] },
) {
  const visited = new Set<EnvironmentModuleNode>();

  async function traverse(url: string) {
    const [, id] = await server.moduleGraph.resolveUrl(url);
    const mod = server.moduleGraph.getModuleById(id);
    if (!mod || visited.has(mod)) {
      return;
    }
    visited.add(mod);
    await Promise.all(
      [...mod.importedModules].map((childMod) => traverse(childMod.url)),
    );
  }

  // ensure import analysis is ready for top entries
  await Promise.all(entries.map((e) => server.transformRequest(e)));

  // traverse
  await Promise.all(entries.map((url) => traverse(url)));

  return [...visited].map((mod) => mod.url).filter((url) => isCSSRequest(url));
}
