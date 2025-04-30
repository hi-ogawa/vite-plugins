import type { Program } from "estree";
import MagicString from "magic-string";
import { getExportNames, hasDirective } from "./utils";

export function transformDirectiveProxyExport(
  ast: Program,
  options: {
    directive: string;
    id: string;
    runtime: (id: string, name: string) => string;
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
    runtime: (id: string, name: string) => string;
    ignoreExportAllDeclaration?: boolean;
  },
) {
  // TODO: preserve `name` location
  const { exportNames } = getExportNames(ast, options);
  const output = new MagicString("");
  for (const name of exportNames) {
    const decl =
      (name === "default" ? `export default` : `export const ${name} =`) +
      ` /* #__PURE__ */ ` +
      options.runtime(JSON.stringify(options.id), JSON.stringify(name));
    output.append(decl + ";\n");
  }
  return { exportNames, output };
}
