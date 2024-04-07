import { hydrateRoot } from "react-dom/client";
import { App } from "./app";

function main() {
  hydrateRoot(document.getElementById("root")!, <App />);
}

main();
