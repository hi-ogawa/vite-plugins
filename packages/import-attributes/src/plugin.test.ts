import * as esModuleLexer from "es-module-lexer";
import { beforeAll, expect, test } from "vitest";
import { transformImportAttributes } from "./plugin";

beforeAll(async () => {
  await esModuleLexer.init;
});

test(transformImportAttributes, () => {
  const input = `import { Counter } from "./counter" with { type: "island" };`;
  expect(transformImportAttributes(input)?.toString()).toMatchInlineSnapshot(
    `"import { Counter } from "./counter?__attributes=%7B%22type%22%3A%22island%22%7D";"`,
  );
});
