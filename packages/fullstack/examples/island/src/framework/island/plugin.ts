import assert from "node:assert";
import vitePluginImportAttributes, {
  getImportAttributesFromId,
} from "@hiogawa/vite-plugin-import-attributes";
import type { Plugin } from "vite";

export function islandPlugin(): Plugin[] {
  return [
    ...vitePluginImportAttributes(),
    {
      name: "island",
      load: {
        handler(id) {
          const { rawId, attributes } = getImportAttributesFromId(id);
          if ("island" in attributes) {
            assert.equal(this.environment.name, "ssr");
            // TODO: how to extract exports?
            return `\
import * as module from ${JSON.stringify(rawId)};
import assets from ${JSON.stringify(rawId + "?assets=client")};
import { createIsland } from "/src/framework/island/runtime-server";
export const Counter = createIsland(module.Counter, "Counter", assets);
`;
          }
        },
      },
    },
    {
      name: "island:raw-import",
      transform: {
        order: "post",
        handler(code) {
          if (code.includes("__island_raw_import__")) {
            return code.replaceAll("__island_raw_import__", "import");
          }
        },
      },
    },
  ];
}
