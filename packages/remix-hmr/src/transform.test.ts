import { describe, expect, it } from "vitest";
import { transform } from "./transform";

describe(transform, () => {
  it("basic", async () => {
    const input = /* js */ `\

export default function FnDefault() {}

export let FnLet = () => {
  useState();
  useEffect;
  useRef();
  // useCallback();
  return "hello";
}

export const FnConst = () => {}

const FnNonExport = () => {}

function notCapitalFn() {}

const NotFn = "hello";

// TODO
// export const FnExpr = function() {}
// export const NotFn2 = "hello";
`;
    expect(
      await transform(input, {
        mode: "vite",
        debug: false,
      }),
    ).toMatchInlineSnapshot(`
      "
      export default function FnDefault() {}

      export let FnLet = () => {
        useState();
        useEffect;
        useRef();
        // useCallback();
        return "hello";
      }

      export let   FnConst = () => {}

      let   FnNonExport = () => {}

      function notCapitalFn() {}

      let   NotFn = "hello";

      // TODO
      // export const FnExpr = function() {}
      // export const NotFn2 = "hello";

      ;import * as $$refresh from "virtual:remix-hmr-runtime";
      if (import.meta.hot) {
        (() => import.meta.hot.accept());
        const $$manager = $$refresh.initialize(
          import.meta.hot,
          undefined,
          {"mode":"vite","debug":false}
        );

        FnDefault = $$manager.wrap("FnDefault", FnDefault, "");
        FnLet = $$manager.wrap("FnLet", FnLet, "useState/useRef/useCallback");
        FnConst = $$manager.wrap("FnConst", FnConst, "");
        FnNonExport = $$manager.wrap("FnNonExport", FnNonExport, "");

        $$manager.setup();
      }
      "
    `);
  });
});
