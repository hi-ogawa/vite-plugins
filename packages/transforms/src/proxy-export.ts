import type { Program } from "estree";
import { getExportNames, hasDirective } from "./utils";

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
      output += `const $$default = ${expr};\n`;
      output += `export default $$default;\n`;
    } else {
      output += `export const ${name} = ${expr};\n`;
    }
  }
  return output;
}
