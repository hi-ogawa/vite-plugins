import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "../App";

function main() {
  ReactDOM.hydrateRoot(
    document.getElementById("root") as HTMLElement,
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

main();
