import "/@vite/client";
import { render } from "hono/jsx/dom";
import { App } from "./app";

function main() {
  const domRoot = document.getElementById("client-app")!;
  render(<App />, domRoot);
}

main();
