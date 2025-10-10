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
    const { e: end, se: expEnd, a: attributeIndex } = importSpecifier;
    if (attributeIndex > -1) {
      const attributesCode = code.slice(attributeIndex, expEnd);
      const attributes = evalValue(attributesCode);
      output ??= new MagicString(code);
      output.appendLeft(
        end,
        "?" +
          new URLSearchParams({
            [KEY]: JSON.stringify(attributes),
          }),
      );
      output.remove(end + 1, expEnd);
    }
  }
  return output;
}

export function getImportAttributesFromId(id: string): object | undefined {
  const { query } = parseIdQuery(id);
  const attributes = query[KEY];
  return attributes as any;
}

function parseIdQuery(id: string): {
  filename: string | undefined;
  query: Record<string, string>;
} {
  if (!id.includes("?")) return { filename: id, query: {} };
  const [filename, rawQuery] = id.split(`?`, 2);
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
