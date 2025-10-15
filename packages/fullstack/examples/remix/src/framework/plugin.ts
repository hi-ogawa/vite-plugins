import assert from "node:assert";
import MagicString from "magic-string";
import type { Plugin } from "vite";

export function frameworkPlugin(): Plugin[] {
  return [
    {
      name: "framework:island",
      transform: {
        handler(code, id) {
          if (this.environment.name !== "ssr") return;
          if (!id.includes("/islands/")) return;
          if (!/\.(t|j)sx?$/.test(id)) return;
          //
          // quick and dirty export wrapping transform
          // (more robust appraoch is found in https://github.com/vitejs/vite-plugin-react/blob/fffb7eb7a4d939783d1da09e2ca6368382735ca3/packages/plugin-rsc/src/transforms/wrap-export.ts#L24)
          //
          // [input]
          //   export function Counter() { ... }
          //
          // [output]
          //  import * as __dom from "@remix-run/dom";
          //  import * as __assets from "<id>?assets=client";
          //  function Counter() { ... }
          //  const __wrap_Counter = __dom.hydrated(__assets.entry + "#Counter", Counter);
          //  export { __wrap_Counter as Counter }
          //
          const s = new MagicString(code);
          const matches = code.matchAll(
            /\b(export)\s+(function|const)\s+(\w+)/dg,
          );
          for (const match of matches) {
            const [exportStart, exportEnd] = match.indices![1];
            s.update(
              exportStart,
              exportEnd,
              " ".repeat(exportEnd - exportStart),
            );
            const exportName = match[3];
            s.append(`;\
const __wrap_${exportName} = __dom.hydrated(__assets.entry + "#" + ${JSON.stringify(exportName)}, ${exportName});
export { __wrap_${exportName} as ${exportName} };`);
          }
          return `\
${s.toString()};
import __assets from ${JSON.stringify(id + "?assets=client")};
import * as __dom from "@remix-run/dom";
`;
        },
      },
    },
    {
      name: "framework:raw-import",
      transform: {
        order: "post",
        handler(code) {
          if (code.includes("__island_raw_import__")) {
            return code.replaceAll("__island_raw_import__", "import");
          }
        },
      },
    },
    {
      name: "framework:frame",
      transform: {
        handler(code, id) {
          if (!id.includes("/frames/")) return;
          if (!/\.(t|j)sx?$/.test(id)) return;
          assert.equal(this.environment.name, "ssr");

          //
          // [input]
          //   export function Counter() { ... }
          //
          // [output]
          //  import * as __dom from "@remix-run/dom";
          //  import * as __dom_jsx from "@remix-run/dom/jsx-runtime";
          //  function Counter() { ... }
          //  const __frame_Counter = ...createFrameWrapper...
          //  export { __frame_Counter as Counter }
          //

          const s = new MagicString(code);
          const matches = code.matchAll(
            /\b(export)\s+(function|const)\s+(\w+)/dg,
          );
          for (const match of matches) {
            const [exportStart, exportEnd] = match.indices![1];
            s.update(
              exportStart,
              exportEnd,
              " ".repeat(exportEnd - exportStart),
            );
            const entry = id.split("/frames/")[1];
            const exportName = match[3];
            s.append(`;\
export const __wrap_${exportName} = (${createFrameWrapper.toString()})(
  ${exportName},
  ${JSON.stringify(entry)},
  ${JSON.stringify(exportName)},
  __dom,
  __dom_jsx
);
export { __wrap_${exportName} as ${exportName} };
`);
          }
          return `\
${s.toString()};
import * as __dom from "@remix-run/dom";
import * as __dom_jsx from "@remix-run/dom/jsx-runtime";
`;
        },
      },
    },
  ];
}

function createFrameWrapper(
  Component: any,
  entry: string,
  exportName: string,
  __dom: typeof import("@remix-run/dom"),
  __dom_jsx: typeof import("@remix-run/dom/jsx-runtime"),
) {
  function FrameWrapper(props: any) {
    const params = new URLSearchParams({
      entry,
      exportName,
      props: JSON.stringify(props),
    });
    const src = "/__frame?" + params.toString();
    return __dom_jsx.jsx(__dom.Frame as any, { src });
  }
  Object.assign(FrameWrapper, { Component });
  return FrameWrapper;
}
