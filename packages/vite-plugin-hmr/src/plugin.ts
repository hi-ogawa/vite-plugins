import {
  type FilterPattern,
  type Plugin,
  createFilter,
  parseAstAsync,
} from "vite";
import { name as packageName } from "../package.json";
import { analyzeExports } from "./transform";

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
        return hmrTransform(code);
      }
      return;
    },
  };
}

export async function hmrTransform(code: string): Promise<string | undefined> {
  const ast = await parseAstAsync(code);
  const result = analyzeExports(code, ast as any);

  // always invalidate for hmr unsupported
  if (result.errors.length > 0) {
    const node = result.errors[0]!.node;
    const message = "unsupported usage: " + code.slice(node.start, node.end);
    return code + "\n" + generateFooterUnsupported(message);
  }

  return result.code + "\n" + generateFooter(result.exportIds);
}

function generateFooter(names: string[]) {
  const parts = names.map(
    (name) => `
  $$registry.exports["${name}"] = {
    value: ${name},
    update: ($$next) => {
      ${name} = $$next;
    }
  };
`
  );

  // requires dummy "hot.accept" for vite to detect
  return `
if (import.meta.env.SSR && import.meta.hot) {
  const $$hmr = await import("@hiogawa/vite-plugin-hmr/runtime");
  const $$registry = $$hmr.createRegistry();

${parts.join("\n")}

  $$hmr.setupHot(import.meta.hot, $$registry);
  import.meta.hot.accept;
}
`;
}

function generateFooterUnsupported(message: string) {
  return `
if (import.meta.env.SSR && import.meta.hot) {
  import.meta.hot.accept(() => {
    import.meta.hot.invalidate(${JSON.stringify(message)})
  });
}
`;
}
