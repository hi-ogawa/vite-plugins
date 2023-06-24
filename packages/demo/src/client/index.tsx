import "virtual:uno.css";
import { tinyassert } from "@hiogawa/utils";
import { globPageRoutes } from "@hiogawa/vite-glob-routes/dist/react-router";
import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

function main() {
  const el = document.getElementById("root");
  tinyassert(el);
  const reactRoot = createRoot(el);
  reactRoot.render(<Root />);
}

function Root() {
  const [router] = React.useState(() => createBrowserRouter(globPageRoutes()));
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

main();
