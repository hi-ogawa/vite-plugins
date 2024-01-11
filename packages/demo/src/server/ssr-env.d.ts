// missing types for explicit "server.browser" import
// (copied from https://github.com/rakkasjs/rakkasjs/blob/65481844280a936601c3eb73a00dbb1c8362ea14/packages/rakkasjs/src/types.d.ts#L12-L15)
declare module "react-dom/server.browser" {
  export * from "react-dom/server";
}
