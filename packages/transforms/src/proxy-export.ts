import type { Program } from "estree";
import MagicString from "magic-string";
import { getExportNames, hasDirective } from "./utils";

export function transformDirectiveProxyExport(
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
  // TODO: preserve `name` location
  const { exportNames } = getExportNames(ast, options);
  const output = new MagicString("");
  for (const name of exportNames) {
    const expr = `/* #__PURE__ */ ${options.runtime}("${options.id}", "${name}")`;
    if (name === "default") {
      output.append(`export default ${expr};\n`);
    } else {
      output.append(`export const ${name} = ${expr};\n`);
    }
  }
  return { exportNames, output };
}
