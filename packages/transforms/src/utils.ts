import type * as estree from "estree";

export function hasDirective(
  body: estree.Program["body"],
  directive: string,
): boolean {
  return !!body.find(
    (stmt) =>
      stmt.type === "ExpressionStatement" &&
      stmt.expression.type === "Literal" &&
      typeof stmt.expression.value === "string" &&
      stmt.expression.value === directive,
  );
}
