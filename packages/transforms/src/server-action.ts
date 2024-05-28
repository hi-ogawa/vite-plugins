import type { Program } from "estree";
import { transformHoistInlineDirective } from "./hoist";
import { transformProxyExport } from "./proxy-export";
import { hasDirective } from "./utils";
import { transformWrapExport } from "./wrap-export";

export async function transformServerActionServer(
  input: string,
  ast: Program,
  options: { id: string; runtime: string },
) {
  if (hasDirective(ast.body, "use server")) {
    return transformWrapExport(input, ast, options);
  }
  return transformHoistInlineDirective(input, ast, {
    ...options,
    directive: "use server",
  });
}

export async function transformServerActionClient(
  ast: Program,
  options: { id: string; runtime: string },
) {
  if (!hasDirective(ast.body, "use server")) {
    return;
  }
  return transformProxyExport(ast, options);
}
