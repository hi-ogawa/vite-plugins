import path from "node:path";
import * as esModuleLexer from "es-module-lexer";
import * as vite from "vite";
import { beforeAll, describe, expect, onTestFinished, test } from "vitest";
import vitePluginImportAttributes, {
  getImportAttributesFromId,
  transformImportAttributes,
} from "./plugin";

beforeAll(async () => {
  await esModuleLexer.init;
});

test(transformImportAttributes, () => {
  const input = `import { Counter } from "./counter" with { island: "client-only" };`;
  expect(transformImportAttributes(input)?.toString()).toMatchInlineSnapshot(
    `"import { Counter } from "./counter?__attributes=%7B%22island%22%3A%22client-only%22%7D";"`,
  );
});

describe("e2e", () => {
  const config: vite.InlineConfig = {
    root: path.join(import.meta.dirname, "./fixtures"),
    configFile: false,
    build: {
      minify: false,
      rollupOptions: {
        input: path.join(import.meta.dirname, "./fixtures/entry.ts"),
      },
    },
    plugins: [
      vitePluginImportAttributes(),
      {
        name: "test-plugin",
        load(id) {
          const parsed = getImportAttributesFromId(id);
          if (parsed?.attributes["island"] === "test") {
            return `\
import * as module from ${JSON.stringify(parsed.rawId)};
export const Counter = Object.assign(module.Counter, {
  __island: true,
});
`;
          }
        },
      },
    ],
  };

  test("dev", async () => {
    const server = await vite.createServer(config);
    onTestFinished(() => server.close());
    const mod = await server.ssrLoadModule("/entry.ts");
    expect(mod.default.__island).toMatchInlineSnapshot(`true`);
  });
});
