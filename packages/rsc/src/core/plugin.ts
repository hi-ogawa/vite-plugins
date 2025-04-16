import type { Plugin } from "vite";

export function vitePluginRscCore(rscOptions: {
  getClientReferences: () => Record<string, string>;
  getServerReferences: () => Record<string, string>;
}): Plugin[] {
  return [
    {
      name: "rsc-virtual",
      resolveId(source) {
        if (source.startsWith("virtual:vite-rsc/")) {
          return "\0" + source;
        }
      },
      load(id) {
        const references =
          id === "\0virtual:vite-rsc/client-references"
            ? rscOptions.getClientReferences()
            : id === "\0virtual:vite-rsc/server-references"
              ? rscOptions.getServerReferences()
              : undefined;
        if (references) {
          const code = Object.entries(references)
            .map(
              ([key, id]) =>
                `${JSON.stringify(key)}: () => import(${JSON.stringify(id)}),`,
            )
            .join("\n");
          return { code: `export default {${code}}`, map: null };
        }
      },
    },
  ];
}
