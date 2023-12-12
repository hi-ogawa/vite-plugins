import { h } from "@hiogawa/tiny-react";

export function App(props: { url: string }) {
  return h.div({}, "hello", h.pre({}, JSON.stringify(props)));
}
