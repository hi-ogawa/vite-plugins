import type { Program } from "estree";
import MagicString from "magic-string";
import { hasDirective } from "./utils";

export async function transformServerAction(
  input: string,
  ast: Program,
  { id, runtime }: { id: string; runtime: string },
) {
  if (!hasDirective(ast.body, "use server")) {
    return;
  }
  const output = new MagicString(input);
  id;
  runtime;
  output;
}
