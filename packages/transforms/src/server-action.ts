import { tinyassert } from "@hiogawa/utils";
import { walk } from "estree-walker";
import MagicString from "magic-string";
import { analyze } from "periscopic";
import { parseAstAsync } from "vite";
import { hasDirective } from "./utils";

const SERVER_DIRECTIVE = "use server";

export async function transformServerActionFile(
  input: string,
  { id, runtime }: { id: string; runtime: string },
) {
  const parsed = await parseAstAsync(input);
  if (!hasDirective(parsed.body, SERVER_DIRECTIVE)) {
    return;
  }
  const output = new MagicString(input);
  id;
  runtime;
  output;
}

export async function transformServerActionInline(
  input: string,
  { id, runtime }: { id: string; runtime: string },
) {
  const parsed = await parseAstAsync(input);
  const output = new MagicString(input);
  const analyzed = analyze(parsed);
  const names: string[] = [];

  walk(parsed, {
    enter(node, parent) {
      if (
        (node.type === "FunctionExpression" ||
          node.type === "FunctionDeclaration" ||
          node.type === "ArrowFunctionExpression") &&
        node.body.type === "BlockStatement" &&
        hasDirective(node.body.body, SERVER_DIRECTIVE)
      ) {
        const scope = analyzed.map.get(node);
        tinyassert(scope);
        const declName = node.type === "FunctionDeclaration" && node.id.name;

        // bind variables which are neither global nor in own scope
        const bindVars = [...scope.references].filter((ref) => {
          // declared function itself is included as reference
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

        // append a new `FunctionDeclaration` at the end
        const newName = `$$action_${names.length}`;
        names.push(newName);
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
        let newCode = `${runtime}(${newName}, "${id}", "${newName}")`;
        if (bindVars.length > 0) {
          newCode = `${newCode}.bind(${["null", ...bindVars].join(", ")})`;
        }
        if (declName) {
          newCode = `const ${declName} = ${newCode};`;
          if (parent?.type === "ExportDefaultDeclaration") {
            output.remove(parent.start, node.start);
            newCode = `${newCode}\nexport default ${declName};`;
          }
        }
        output.appendLeft(node.start, newCode);
      }
    },
  });

  return {
    output,
    names,
  };
}
