import { hydrateRoot } from "react-dom/client";
import { App } from "./App";

function main() {
  hydrateRoot(document.getElementById("root")!, <App />);
}

main();
