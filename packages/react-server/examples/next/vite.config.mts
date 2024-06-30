import next from "next/vite";
import { Plugin, defineConfig, parseAstAsync } from "vite";

export default defineConfig({
  plugins: [
    next({
      plugins: [
        vitePluginFontExtract({
          importSource: "next/font/local",
        }),
      ],
    }),
  ],
});

// cf.
// https://nextjs.org/docs/app/building-your-application/optimizing/fonts
// https://github.com/vercel/next.js/blob/b9bd23baec14508400c502b3651f4cf2497e883b/packages/next/src/build/webpack/loaders/next-font-loader/index.ts
// https://github.com/vercel/next.js/blob/b9bd23baec14508400c502b3651f4cf2497e883b/packages/next/src/build/webpack/config/blocks/css/loaders/next-font.ts
// https://github.com/vercel/next.js/blob/b9bd23baec14508400c502b3651f4cf2497e883b/packages/font/src/local/loader.ts
/*

//
// INPUT (js)
//
import localFont from "next/font/local";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

//
// OUTPUT (js)
//
import "virtual:next-font/...css"

const geistSans = {
  className: "__className_1e4310",
  variable: "__variable_1e4310",
}

//
// OUTPUT (css)
//
@font-face {
  font-family: 'geistSans';
  src: url(/abs-path/fonts/GeistVF.woff) format('woff');
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: 'geistSans Fallback';
  src: local("Arial");
  ascent-override: 85.83%;
  descent-override: 20.52%;
  line-gap-override: 9.33%;size-adjust: 107.19%
}
.__className_1e4310 {
  font-family: 'geistSans', 'geistSans Fallback'
}
.__variable_1e4310 {
  --font-geist-sans: 'geistSans', 'geistSans Fallback'
}
*/

import assert from "node:assert";
import path from "node:path";
import MagicString from "magic-string";

// rollup ast has node position
declare module "estree" {
  interface BaseNode {
    start: number;
    end: number;
  }
}

function vitePluginFontExtract({
  importSource,
}: { importSource: string }): Plugin[] {
  return [
    {
      name: vitePluginFontExtract.name + ":transform-extract",
      async transform(code, id) {
        if (!code.includes(importSource)) {
          return;
        }

        const ast = await parseAstAsync(code);
        const output = new MagicString(code);

        // find top level import
        //   import localFont from "next/font/local"
        let importedName: string | undefined;
        for (const node of ast.body) {
          if (node.type === "ImportDeclaration") {
            if (node.source.value === importSource) {
              assert(node.specifiers.length === 1);
              const spec = node.specifiers[0];
              assert(spec.type === "ImportDefaultSpecifier");
              importedName = spec.local.name;
              output.remove(node.start, node.end);
            }
          }
        }
        if (!importedName) {
          return;
        }

        // replace font calls
        //   const MyFont = localFont({ ... })
        const fonts: FontConfig[] = [];
        for (const node of ast.body) {
          if (node.type === "VariableDeclaration") {
            for (const decl of node.declarations) {
              if (
                decl.id.type === "Identifier" &&
                decl.init?.type === "CallExpression" &&
                decl.init.callee.type === "Identifier" &&
                decl.init.callee.name === importedName
              ) {
                let font: FontConfig;
                try {
                  font = evaluateFont(
                    importedName,
                    code.slice(decl.init.start, decl.init.end),
                  );
                } catch (e) {
                  console.error(
                    `[WARNING] unsupported usage '${importedName}'`,
                    e,
                  );
                  continue;
                }
                font.src = path.resolve(id, "..", font.src);
                font.id = decl.id.name;
                fonts.push(font);
                const replaced: FontResult = {
                  className: `__font_class_${font.id}`,
                  variable: `__font_variable_${font.id}`,
                };
                output.update(
                  decl.init.start,
                  decl.init.end,
                  JSON.stringify(replaced),
                );
              }
            }
          }
        }

        for (const font of fonts) {
          const css =
            "virtual:font-extract/" +
            encodeURIComponent(JSON.stringify(font)) +
            ".css";
          output.prepend(`import "${css}";\n`);
        }

        return {
          code: output.toString(),
          map: output.generateMap({ hires: "boundary" }),
        };
      },
    },
    {
      name: vitePluginFontExtract.name + ":virtual-css",
      resolveId(source, _importer, _options) {
        if (source.startsWith("virtual:font-extract/")) {
          return "\0" + source;
        }
      },
      load(id, _options) {
        if (id.startsWith("\0virtual:font-extract/")) {
          id = id.split("?")[0];
          const font: FontConfig = JSON.parse(
            decodeURIComponent(
              id.slice("\0virtual:font-extract/".length, -".css".length),
            ),
          );
          const ext = path.extname(font.src);
          const format = FONT_FORMAT_MAP[ext];
          if (!format) {
            console.error(`[WARNING] unsupported font format '${font.src}'`);
            return `/* font extract failed : ${font.src} */`;
          }
          // TODO: fallback
          const output = `
            @font-face {
              font-family: '${font.id}';
              src: url(${font.src}) format('${format}');
              font-weight: ${font.weight};
              font-display: swap;
            }
            .__font_class_${font.id} {
              font-family: '${font.id}';
            }
            .__font_variable_${font.id} {
              ${font.variable}: '${font.id}';
            }
          `;
          return output;
        }
      },
    },
  ];
}

// https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/src#font_formats
const FONT_FORMAT_MAP = {
  ".otf": "opentype",
  ".ttf": "truetype",
  ".woff": "woff",
  ".woff2": "woff2",
};

function evaluateFont(fontFnName: string, code: string): FontConfig {
  const fontFn = (arg: unknown) => arg;
  const result = (0, eval)(`(${fontFnName}) => ${code}`)(fontFn);
  return result;
}

type FontConfig = {
  id: string;
  src: string;
  variable: string;
  weight: string;
};

type FontResult = {
  variable: string;
  className: string;
};
