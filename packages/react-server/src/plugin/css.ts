import type { ViteDevServer } from "vite";

// cf.
// https://github.com/hi-ogawa/vite-plugins/blob/3c496fa1bb5ac66d2880986877a37ed262f1d2a6/packages/vite-glob-routes/examples/demo/vite-plugin-ssr-css.ts

export async function collectStyle(server: ViteDevServer, entries: string[]) {
  const visited = new Set<string>();

  async function traverse(url: string) {
    const [, id] = await server.moduleGraph.resolveUrl(url);
    if (visited.has(id)) {
      return;
    }
    visited.add(id);
    const mod = server.moduleGraph.getModuleById(id);
    if (!mod) {
      return;
    }
    await Promise.all(
      [...mod.importedModules].map((childMod) => traverse(childMod.url)),
    );
  }

  // ensure import analysis is ready for top entries
  await Promise.all(entries.map((e) => server.transformRequest(e)));

  // traverse
  await Promise.all(entries.map((url) => traverse(url)));

  const styles = await Promise.all(
    [...visited].map(async (url) => {
      if (!url.match(CSS_LANGS_RE)) {
        return;
      }
      const mod = await server.ssrLoadModule(url);
      if ("default" in mod && typeof mod["default"] === "string") {
        return mod["default"];
      }
      return;
    }),
  );

  return styles.filter(Boolean).join("\n");
}

// cf. https://github.com/vitejs/vite/blob/d6bde8b03d433778aaed62afc2be0630c8131908/packages/vite/src/node/constants.ts#L49C23-L50
const CSS_LANGS_RE =
  /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;
