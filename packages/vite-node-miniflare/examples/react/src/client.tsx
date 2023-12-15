import { tinyassert } from "@hiogawa/utils";
import ReactDomClient from "react-dom/client";
import { App } from "./app";

function main() {
  const el = document.getElementById("root");
  tinyassert(el);
  ReactDomClient.hydrateRoot(el, <App url={window.location.href} />);
  el.dataset["testid"] = "hydrated"; // for e2e
}

main();
