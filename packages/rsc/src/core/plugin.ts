import type { Plugin } from "vite";

export default function vitePluginRscCore(): Plugin[] {
  return [
    {
      // commonjsOptions needs to be tweaked when this is a linked dep
      // since otherwise vendored cjs doesn't work.
      name: "rsc:workaround-linked-dep",
      apply: () => !import.meta.url.includes("/node_modules/"),
      configEnvironment() {
        return {
          build: {
            commonjsOptions: {
              include: [/\/node_modules\//, /\/vendor\/react-server-dom\//],
            },
          },
        };
      },
    },
  ];
}
