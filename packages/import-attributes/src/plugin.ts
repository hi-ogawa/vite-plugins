import * as esModuleLexer from "es-module-lexer";
import MagicString from "magic-string";
import { type Plugin, createFilter } from "vite";

export default function vitePluginImportAttributes(pluginOptions?: {
  include: string | RegExp | (string | RegExp)[];
  exclude?: string | RegExp | (string | RegExp)[];
}): Plugin[] {
  const filter = createFilter(
    pluginOptions?.include,
    pluginOptions?.exclude ?? /\/node_modules\//,
  );
  return [
    {
      name: "import-attributes",
      async config() {
        await esModuleLexer.init;
      },
      transform(code, id) {
        if (!code.includes("with")) return;
        if (!filter(id)) return;

        const transformed = transformImportAttributes(code);
        if (transformed) {
          return {
            code: transformed.toString(),
            map: transformed.generateMap({ hires: "boundary" }),
          };
        }
      },
      resolveId: {
        order: "pre",
        async handler(source, importer, options) {
          const result = getImportAttributesFromId(source);
          if (Object.keys(result.attributes).length > 0) {
            const resolved = await this.resolve(source, importer, options);
            console.log({ source, result, resolved });
            if (resolved) {
              resolved.meta ??= {};
              resolved.meta["vite-plugin-import-attributes"] =
                getImportAttributesFromId(resolved.id);
            }
            return resolved;
          }
        },
      },
    },
  ];
}

const KEY = "__attributes";

export function transformImportAttributes(
  code: string,
): MagicString | undefined {
  const parsed = esModuleLexer.parse(code);
  let output: MagicString | undefined;
  for (const importSpecifier of parsed[0]) {
    let { e: moduleEnd, se: statementEnd, a: attributeIndex } = importSpecifier;
    if (attributeIndex > -1) {
      // tweak end for dynamic import
      if (code[statementEnd - 1] === ")") {
        statementEnd--;
      }
      const attributesCode = code.slice(attributeIndex, statementEnd);
      const attributes = evalValue(attributesCode);
      output ??= new MagicString(code);
      output.appendLeft(
        moduleEnd,
        "?" +
          new URLSearchParams({
            [KEY]: JSON.stringify(attributes),
          }),
      );
      output.remove(moduleEnd + 1, statementEnd);
    }
  }
  return output;
}

export type importAttributesMeta = {
  rawId: string;
  attributes: Record<string, unknown>;
};

export function getImportAttributesFromId(id: string): {
  rawId: string;
  attributes: Record<string, unknown>;
} {
  const { filename, query } = parseIdQuery(id);
  if (query[KEY]) {
    const attributes = JSON.parse(query[KEY]);
    delete query[KEY];
    const rawId = filename! + new URLSearchParams(query);
    return { rawId, attributes };
  }
  return { rawId: id, attributes: {} };
}

function parseIdQuery(id: string): {
  filename: string | undefined;
  query: Record<string, string>;
} {
  if (!id.includes("?")) return { filename: id, query: {} };
  const [filename, rawQuery] = id.split(`?`, 2) as [string, string];
  const query = Object.fromEntries(new URLSearchParams(rawQuery));
  return { filename, query };
}

// https://github.com/vitejs/vite/blob/ea9aed7ebcb7f4be542bd2a384cbcb5a1e7b31bd/packages/vite/src/node/utils.ts#L1469-L1475
function evalValue<T = any>(rawValue: string): T {
  const fn = new Function(`
    var console, exports, global, module, process, require
    return (\n${rawValue}\n)
  `);
  return fn();
}
