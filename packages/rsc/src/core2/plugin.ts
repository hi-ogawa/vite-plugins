import type { Plugin } from "vite";

export default function vitePluginRscCore2(): Plugin[] {
  return [
    {
      name: "rsc:patch-browser-raw-import",
      transform: {
        order: "post",
        handler(code) {
          if (code.includes("__vite_rsc_raw_import__")) {
            // inject dynamic import last to avoid Vite adding `?import` query to client references
            return code.replace("__vite_rsc_raw_import__", "import");
          }
        },
      },
    },
  ];
}
