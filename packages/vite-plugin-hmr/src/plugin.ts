import { type FilterPattern, type Plugin, createFilter } from "vite";
import { name as packageName } from "../package.json";

export function vitePluginHmr(pluginOpts: {
  include?: FilterPattern;
  exclude?: FilterPattern;
}): Plugin {
  const filter = createFilter(
    pluginOpts.include,
    pluginOpts.exclude ?? ["**/node_modules/**"]
  );

  return {
    name: packageName,
    apply: "serve",
    transform(code, id, options) {
      if (options?.ssr && filter(id)) {
        return hmrTransform(code, id);
      }
      return;
    },
  };
}

export function hmrTransform(code: string, id: string): string | undefined {
  // transform to inject something like below
  /*
    if (import.meta.env.SSR && import.meta.hot) {
      const $$hmr = await import("@hiogawa/vite-plugin-hmr/runtime");
      const $$registry = $$hmr.createRegistry();

      $$registry.exports["App"] = {
        value: App,
        update: ($$next) => {
          // @ts-ignore
          App = $$next;
        }
      };

      $$hmr.setupHot(import.meta.hot, $$registry);
    }
  */

  // TODO: use vite/rollup parser
  // TODO: replace `export const` with `export let` for reassignment
  // TODO: magic-string + sourcemap

  // extract named exports
  const matches = code.matchAll(/export\s+(function|let)\s+(\w+)\b/g);
  const exportNames = Array.from(matches).map((m) => m[2]);
  if (0) {
    console.log({ id }, exportNames);
  }

  if (exportNames.length === 0) {
    return;
  }

  // append runtime in footer
  const parts = exportNames.map(
    (name) => `
  $$registry.exports["${name}"] = {
    value: ${name},
    update: ($$next) => {
      ${name} = $$next;
    }
  };
`
  );

  // need dummy "hot.accept" for vite's detection
  const footer = `
if (import.meta.env.SSR && import.meta.hot) {
  const $$hmr = await import("@hiogawa/vite-plugin-hmr/runtime");
  const $$registry = $$hmr.createRegistry();

${parts.join("\n")}

  $$hmr.setupHot(import.meta.hot, $$registry);
  import.meta.hot.accept;
}
`;
  return code + footer;
}
