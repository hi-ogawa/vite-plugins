import { tinyassert } from "@hiogawa/utils";
import { hydrateRoot } from "react-dom/client";
import { App } from "./app";

function main() {
  const el = document.getElementById("root");
  tinyassert(el);
  hydrateRoot(el, <App url={window.location.href} />);
  el.dataset["testid"] = "hydrated"; // for e2e
}

main();
