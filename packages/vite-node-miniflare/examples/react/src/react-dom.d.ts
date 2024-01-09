// directly import "react-dom/server.browser" without fiddling with `resolve.conditions`
// but it lacks typing currently...
declare module "react-dom/server.browser" {
  export * from "react-dom/server";
}
