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

  // track current top level statement to hoist an action right before
  let topStmt: estree.Node;

  walk(parsed, {
    enter(node, parent) {
      if (parent === parsed) {
        topStmt = node;
      }
      if (
        (node.type === "FunctionExpression" ||
          node.type === "FunctionDeclaration" ||
          node.type === "ArrowFunctionExpression") &&
        node.body.type === "BlockStatement" &&
        getFunctionDirective(node.body.body) === SERVER_DIRECTIVE
      ) {
        const scope = analyzed.map.get(node);
        tinyassert(scope);

        if (node.type === "FunctionDeclaration") {
          // top level function
          if (scope.parent === analyzed.scope) {
            names.push(node.id.name);
            return;
          }

          // otherwise lift closure by overwrite + move
          const liftName = `$$action_${names.length}`;
          names.push(liftName);
          const bindVars = [...scope.references].filter((ref) => {
            // function name itself is included as reference
            if (ref === node.id.name) {
              return false;
            }
            const owner = scope.find_owner(ref);
            return owner && owner !== scope && owner !== analyzed.scope;
          });
          const liftParams = [
            ...bindVars,
            ...node.params.map((n) => input.slice(n.start, n.end)),
          ].join(", ");
          output.update(
            node.start,
            node.body.start,
            `\n;let ${liftName} = ${
              node.async ? "async " : ""
            }(${liftParams}) => `,
          );
          // output.appendLeft(node.end, ";\n");
          output.move(node.start, node.end, input.length);

          // replace original declartion with action bind
          const bindParams = ["null", ...bindVars].join(", ");
          const bindCode = `const ${node.id.name} = ${liftName}.bind(${bindParams});`;
          output.appendLeft(node.start, bindCode);
          return;
        }

        if (node.type === "ArrowFunctionExpression") {
          // TODO: not sure how to deal with top level function
          tinyassert(scope.parent !== analyzed.scope);

          // lift closure by overwrite + move
          const liftName = `$$action_${names.length}`;
          names.push(liftName);
          const bindVars = [...scope.references].filter((ref) => {
            const owner = scope.find_owner(ref);
            return owner && owner !== scope && owner !== analyzed.scope;
          });
          const liftParams = [
            ...bindVars,
            ...node.params.map((n) => input.slice(n.start, n.end)),
          ].join(", ");
          output.update(
            node.start,
            node.body.start,
            `;\nlet ${liftName} = ${
              node.async ? "async " : ""
            }(${liftParams}) => `,
          );
          output.move(node.start, node.end, input.length); // move to the end

          // replace original declartion with action bind
          const bindParams = ["null", ...bindVars].join(", ");
          output.appendLeft(node.start, `${liftName}.bind(${bindParams})`);
        }
      }
    },
  });

  console.log(names);

  if (names.length === 0) {
    return;
  }

  output.append(";\n");
  output.append(
    `import { registerServerReference as $$register } from "/src/features/server-action/server";\n`,
  );
  names.forEach((name) => {
    output.append(`${name} = $$register(${name}, "${id}", "${name}");\n`);
    output.append(`export { ${name} };\n`);
  });

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
