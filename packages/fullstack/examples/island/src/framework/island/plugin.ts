import assert from "node:assert";
import vitePluginImportAttributes, {
  getImportAttributesFromId,
} from "@hiogawa/vite-plugin-import-attributes";
import * as esModuelLexer from "es-module-lexer";
import type { Plugin } from "vite";

export function islandPlugin(): Plugin[] {
  return [
    ...vitePluginImportAttributes(),
    {
      name: "island",
      async config() {
        await esModuelLexer.init;
      },
      transform: {
        async handler(code, id) {
          const { rawId, attributes } = getImportAttributesFromId(id);
          if ("island" in attributes) {
            assert.equal(this.environment.name, "ssr");
            const parsed = esModuelLexer.parse(code);
            let output = "";
            for (const e of parsed[1]) {
              output +=
                `export ${e.n === "default" ? "" : "const"} ${e.n} = __runtime.createIsland(` +
                `__module[${JSON.stringify(e.n)}],` +
                `${JSON.stringify(e.n)},` +
                `__assets,` +
                `);\n`;
            }
            return `\
import * as __module from ${JSON.stringify(rawId)};
import __assets from ${JSON.stringify(rawId + "?assets=client")};
import * as __runtime from "/src/framework/island/runtime-server";
${output}
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
