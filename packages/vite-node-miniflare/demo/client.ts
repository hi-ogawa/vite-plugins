import { h, hydrate } from "@hiogawa/tiny-react";
import { tinyassert } from "@hiogawa/utils";
import { App } from "./app";

function main() {
  const el = document.getElementById("root");
  tinyassert(el);
  hydrate(h(App, { url: window.location.href }), el);
}

main();
