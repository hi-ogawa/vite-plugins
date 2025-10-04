import { describe, expect, test } from "vitest";
import { processHtml } from "./html";

describe(processHtml, () => {
  test("basic", async () => {
    const result = await processHtml(`\
<!DOCTYPE html><html><head>
  <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;</script>

  <script type="module" src="/@vite/client"></script>
</head><body><script src="/test"></script></body></html>      
`);
    expect(result).toMatchInlineSnapshot(`
      {
        "body": "<script src="/test"></script>",
        "descriptors": [
          {
            "attrs": {
              "type": "module",
            },
            "children": "import { injectIntoGlobalHook } from "/@react-refresh";
      injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;",
            "injectTo": "head",
            "tag": "script",
          },
          {
            "attrs": {
              "src": "/@vite/client",
              "type": "module",
            },
            "injectTo": "head",
            "tag": "script",
          },
          {
            "attrs": {
              "src": "/test",
            },
            "injectTo": "body",
            "tag": "script",
          },
        ],
        "head": "
        <script type="module">import { injectIntoGlobalHook } from "/@react-refresh";
      injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;</script>

        <script type="module" src="/@vite/client"></script>
      ",
      }
    `);
  });
});
