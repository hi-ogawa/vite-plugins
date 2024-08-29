import { expect, test } from "vitest";
import { FETCH_URL_RE } from "./import-meta-url";

test("regex", () => {
  // https://github.com/vercel/next-app-router-playground/blob/9eb072ef32a7b40a4f8df04337b79243a3408291/app/api/og/route.tsx#L7-L9
  const code = `
const interSemiBold = fetch(
  new URL('./Inter-SemiBold.ttf', import.meta.url),
).then((res) => res.arrayBuffer());
`;
  expect(code.match(FETCH_URL_RE)).toMatchInlineSnapshot(`
    [
      "fetch(
      new URL('./Inter-SemiBold.ttf', import.meta.url),
    )",
    ]
  `);
});
