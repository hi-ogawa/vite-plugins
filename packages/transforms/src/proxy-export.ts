import type { Program } from "estree";
import MagicString from "magic-string";
import { getExportNames, hasDirective } from "./utils";

// TODO: remove async
export async function transformDirectiveProxyExport(
  ast: Program,
  options: {
    directive: string;
    id: string;
    runtime: string;
    ignoreExportAllDeclaration?: boolean;
  },
) {
  if (!hasDirective(ast.body, options.directive)) {
    return;
  }
  return transformProxyExport(ast, options);
}

export function transformProxyExport(
  ast: Program,
  options: {
    id: string;
    runtime: string;
    ignoreExportAllDeclaration?: boolean;
  },
) {
  const { exportNames } = getExportNames(ast, options);
  let output = "";
  for (const name of exportNames) {
    const expr = `${options.runtime}("${options.id}", "${name}")`;
    if (name === "default") {
      output += `export default ${expr};\n`;
    } else {
      output += `export const ${name} = ${expr};\n`;
    }
  }
  return new MagicString(output);
}
