import { h, renderToString } from "@hiogawa/tiny-react";

function App() {
  return h.div({}, "hello");
}

export function render() {
  const html = renderToString(h(App, {}));
  return html;
}
