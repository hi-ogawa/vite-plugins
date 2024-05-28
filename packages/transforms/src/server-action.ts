import { tinyassert } from "@hiogawa/utils";
import type * as estree from "estree";
import { walk } from "estree-walker";
import MagicString from "magic-string";
import { analyze } from "periscopic";
import { parseAstAsync } from "vite";

// extend types for rollup ast with node position
declare module "estree" {
  interface BaseNode {
    start: number;
    end: number;
  }
}

export async function transformServerActionInline(input: string, id: string) {
  const parsed = await parseAstAsync(input);
  const output = new MagicString(input);
  const analyzed = analyze(parsed);
  const names: string[] = [];

  walk(parsed, {
    enter(node) {
      if (
        (node.type === "FunctionExpression" ||
          node.type === "FunctionDeclaration" ||
          node.type === "ArrowFunctionExpression") &&
        node.body.type === "BlockStatement" &&
        getFunctionDirective(node.body.body) === SERVER_DIRECTIVE
      ) {
        const scope = analyzed.map.get(node);
        tinyassert(scope);
        const declName = node.type === "FunctionDeclaration" && node.id.name;

        // lambda lifting
        const newName = `$$lift_${names.length}`;
        names.push(newName);
        const bindVars = [...scope.references].filter((ref) => {
          // function name itself is included as reference
          if (ref === declName) {
            return false;
          }
          const owner = scope.find_owner(ref);
          return owner && owner !== scope && owner !== analyzed.scope;
        });
        const newParams = [
          ...bindVars,
          ...node.params.map((n) => input.slice(n.start, n.end)),
        ].join(", ");

        // append a new `FunctionDeclaration` at the end since they can hoist automatically
        output.update(
          node.start,
          node.body.start,
          `\n;export ${
            node.async ? "async " : ""
          }function ${newName}(${newParams}) `,
        );
        output.appendLeft(node.end, ";\n");
        output.move(node.start, node.end, input.length);

        // replace original declartion with action register + bind
        let newCode = `$$register(${newName}, "${id}", "${newName}")`;
        if (bindVars.length > 0) {
          newCode = `${newCode}.bind(${["null", ...bindVars].join(", ")})`;
        }
        if (declName) {
          // TODO: broken when "export default"
          newCode = `const ${node.id.name} = ${newCode};`;
        }
        output.appendLeft(node.start, newCode);
      }
    },
  });

  if (names.length === 0) {
    return;
  }

  output.prepend(
    `import { registerServerReference as $$register } from "/src/features/server-action/server";\n`,
  );

  return output;
}

function getFunctionDirective(body: estree.Statement[]): string | undefined {
  const stmt = body[0];
  if (
    stmt &&
    stmt.type === "ExpressionStatement" &&
    stmt.expression.type === "Literal" &&
    typeof stmt.expression.value === "string"
  ) {
    return stmt.expression.value;
  }
  return;
}

const SERVER_DIRECTIVE = "use server";
