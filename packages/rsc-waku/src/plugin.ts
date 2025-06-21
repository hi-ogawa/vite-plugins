import type { EnvironmentOptions, Plugin } from "vite";

const PKG_NAME = "@hiogawa/vite-rsc-waku";

export function rscWaku(): Plugin[] {
  return [
    {
      name: "rsc:waku",
      config() {
        const toEnvironmentOption = (entry: string) =>
          ({
            build: {
              rollupOptions: {
                input: {
                  index: `${PKG_NAME}/${entry}`,
                },
              },
            },
          }) satisfies EnvironmentOptions;

        return {
          define: {
            "import.meta.env.WAKU_CONFIG_BASE_PATH": JSON.stringify("/"),
            "import.meta.env.WAKU_CONFIG_RSC_BASE": JSON.stringify("RSC"),
          },
          environments: {
            client: toEnvironmentOption("entry.browser"),
            ssr: toEnvironmentOption("entry.ssr"),
            rsc: toEnvironmentOption("entry.rsc"),
          },
        };
      },
      configEnvironment(_name, _config, _env) {
        return {
          resolve: {
            noExternal: [PKG_NAME],
          },
          optimizeDeps: {
            exclude: [PKG_NAME],
          },
        };
      },
    },
    {
      // rewrite `react-server-dom-webpack` in `waku/minimal/client`
      name: "rsc:waku:patch-webpack",
      enforce: "pre",
      resolveId(source, _importer, _options) {
        if (source === "react-server-dom-webpack/client") {
          return "\0" + source;
        }
      },
      load(id) {
        if (id === "\0react-server-dom-webpack/client") {
          if (this.environment.name === "client") {
            return `
              import * as ReactClient from '@hiogawa/vite-rsc/browser';
              export default ReactClient;
            `;
          }
          return `export default {}`;
        }
      },
    },
    {
      name: "rsc:waku:user-entries",
      resolveId(source, _importer, options) {
        if (source === "virtual:vite-rsc-waku/server-entry") {
          return this.resolve("/src/server-entry", undefined, options);
        }
        if (source === "virtual:vite-rsc-waku/client-entry") {
          return this.resolve("/src/client-entry", undefined, options);
        }
      },
    },
  ];
}
