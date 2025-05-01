import type { Program } from "estree";
import { transformHoistInlineDirective } from "./hoist";
import { hasDirective } from "./utils";
import { transformWrapExport } from "./wrap-export";

export function transformServerActionServer(
  input: string,
  ast: Program,
  options: {
    runtime: (value: string, name: string) => string;
    rejectNonAsyncFunction?: boolean;
  },
) {
  // TODO: unify
  if (hasDirective(ast.body, "use server")) {
    return transformWrapExport(input, ast, options);
  }
  return transformHoistInlineDirective(input, ast, {
    ...options,
    directive: "use server",
  });
}
