import type { Program } from "estree";
import { transformHoistInlineDirective } from "./hoist";
import { transformProxyExport } from "./proxy-export";
import { hasDirective } from "./utils";
import { transformWrapExport } from "./wrap-export";

export async function transformServerActionServer(
  input: string,
  ast: Program,
  { id, runtime }: { id: string; runtime: string },
) {
  if (hasDirective(ast.body, "use server")) {
    return transformWrapExport(input, ast, {
      id,
      runtime,
      ignoreExportAllDeclaration: true,
    });
  }
  return transformHoistInlineDirective(input, ast, {
    id,
    runtime,
    directive: "use server",
  });
}

export async function transformServerActionClient(
  ast: Program,
  { id, runtime }: { id: string; runtime: string },
) {
  if (!hasDirective(ast.body, "use server")) {
    return;
  }
  return transformProxyExport(ast, {
    id,
    runtime,
  });
}
