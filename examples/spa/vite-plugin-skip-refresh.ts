import { type FilterPattern, type Plugin, createFilter } from "vite";

// quick-dirty plugin to mutate Function.name to cheat react-refresh's capitalized name check
// https://github.com/facebook/react/blob/4e3618ae41669c95a3377ae615c727f74f89d141/packages/react-refresh/src/ReactFreshRuntime.js#L713-L715
// https://github.com/vitejs/vite-plugin-react/blob/4bebe5bd7c0267f6b088005293870cf69953b73a/packages/plugin-react/src/refreshUtils.js#L38

// TODO
// This only works for function exports. So, this approach won't work when non-function object is used for the "handle" convention.
// https://reactrouter.com/en/main/route/route#handle
// https://remix.run/docs/en/main/route/handle

// TODO: HDR?

export function vitePluginSkipRefreshPlugin(pluginOpts: {
  include: FilterPattern;
}): Plugin {
  const filter = createFilter(pluginOpts.include);

  return {
    name: "local:" + vitePluginSkipRefreshPlugin.name,
    apply: "serve",
    transform(code, id, options) {
      if (options?.ssr || !filter(id)) {
        return;
      }
      code += createSkipRefresh("loader");
      return { code };
    },
  };
}

const createSkipRefresh = (name: string) => `
// [skip-refresh] ${name}
if (typeof ${name} === "function") {
  Object.defineProperty(${name}, "name", { value: "SkipRefresh_${name}" });
}
`;
