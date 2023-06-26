import "virtual:uno.css";
import { tinyassert } from "@hiogawa/utils";
import { globPageRoutes } from "@hiogawa/vite-glob-routes/dist/react-router";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router-dom";
import {
  ReactQueryWrapper,
  createQueryClientWithState,
} from "../utils/react-query-utils";
import { RouterProviderWithTransition } from "./react-transition";

function main() {
  const el = document.getElementById("root");
  tinyassert(el);

  const router = createBrowserRouter(globPageRoutes());
  const queryClient = createQueryClientWithState();
  const root = (
    <React.StrictMode>
      <ReactQueryWrapper queryClient={queryClient}>
        <RouterProviderWithTransition router={router} />
      </ReactQueryWrapper>
    </React.StrictMode>
  );
  hydrateRoot(el, root);
  el.dataset["testid"] = "hydrated"; // for e2e
}

main();
