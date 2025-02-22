import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { expect, test } from "vitest";

const $ = promisify(execFile);

test("data", async () => {
  const result = await $("node", [
    "--import",
    path.join(import.meta.dirname, "../../dist/hooks/register-data.js"),
    path.join(import.meta.dirname, "./fixtures/test-data.js"),
  ]);
  expect(result).toMatchInlineSnapshot(`
    {
      "stderr": "",
      "stdout": "hello

    ",
    }
  `);
});

test("wasm", async () => {
  const result = await $("node", [
    "--import",
    path.join(import.meta.dirname, "../../dist/hooks/register-wasm.js"),
    path.join(import.meta.dirname, "./fixtures/test-wasm.js"),
  ]);
  expect(result).toMatchInlineSnapshot(`
    {
      "stderr": "",
      "stdout": "3
    ",
    }
  `);
});
