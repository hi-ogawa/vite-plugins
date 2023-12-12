import { h } from "@hiogawa/tiny-react";

console.log("@@ importing app.ts");

export function App(props: { url: string }) {
  return h.div({}, "hello", h.pre({}, JSON.stringify(props)));
}
