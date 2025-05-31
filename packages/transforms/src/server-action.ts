import type { Program } from "estree";
import { transformHoistInlineDirective } from "./hoist";
import { hasDirective } from "./utils";
import { transformWrapExport } from "./wrap-export";

// TODO
// source map for `options.runtime` (registerServerReference) call
// needs to match original position.
export function transformServerActionServer(
  input: string,
  ast: Program,
  options: {
    runtime: (value: string, name: string) => string;
    rejectNonAsyncFunction?: boolean;
    encode?: (value: string) => string;
    decode?: (value: string) => string;
  },
) {
  // TODO: unify (generalize transformHoistInlineDirective to support top leve directive case)
  if (hasDirective(ast.body, "use server")) {
    return transformWrapExport(input, ast, options);
  }
  return transformHoistInlineDirective(input, ast, {
    ...options,
    directive: "use server",
  });
}
