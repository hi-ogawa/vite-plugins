import assert from "node:assert";
import type { Plugin } from "vite";

export function islandPlugin(): Plugin[] {
  return [
    {
      name: "island",
      load: {
        handler(id) {
          const { filename, query } = parseIdQuery(id);
          const q = query["island"];
          if (typeof q !== "undefined") {
            assert.equal(this.environment.name, "ssr");
            return `\
import * as module from ${JSON.stringify(filename)};
import assets from ${JSON.stringify(filename + "?assets=client")};
import { createIsland } from "/src/framework/island/runtime-server";
export default createIsland(module.default, "default", assets);
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

// https://github.com/vitejs/vite-plugin-vue/blob/06931b1ea2b9299267374cb8eb4db27c0626774a/packages/plugin-vue/src/utils/query.ts#L13
function parseIdQuery(id: string): {
  filename: string;
  query: {
    [k: string]: string;
  };
} {
  if (!id.includes("?")) return { filename: id, query: {} };
  const [filename, rawQuery] = id.split(`?`, 2) as [string, string];
  const query = Object.fromEntries(new URLSearchParams(rawQuery));
  return { filename, query };
}
