import { type FilterPattern, type Plugin, createFilter } from "vite";
import { transform } from "./transform";

export default function vitePluginRemixHmr(options?: {
  include?: FilterPattern;
  exclude?: FilterPattern;
}): Plugin {
  const filter = createFilter(
    options?.include ?? /\.[tj]sx$/,
    options?.exclude ?? /\/node_modules\//,
  );
  return {
    name: "remix-hmr",
    apply: "serve",
    applyToEnvironment: (environment) => environment.name === "client",
    transform: {
      handler(code, id) {
        if (filter(id)) {
          return transform(code, {
            mode: "vite",
            debug: true,
          });
        }
      },
    },
    resolveId: {
      handler(source) {
        if (source === "virtual:remix-hmr-runtime") {
          return this.resolve("./runtime.js", import.meta.filename);
        }
      },
    },
  };
}
