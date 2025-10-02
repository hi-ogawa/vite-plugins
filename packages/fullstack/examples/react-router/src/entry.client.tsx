// @ts-ignore
import "virtual:react-hmr-preamble";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router";
import { routes } from "./routes";

declare let __staticRouterHydrationData: any;

function main() {
  const router = createBrowserRouter(routes, {
    hydrationData: __staticRouterHydrationData,
  });

  function BrowserRoot() {
    return <RouterProvider router={router} />;
  }

  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <BrowserRoot />
      </StrictMode>,
    );
  });

  if (import.meta.hot) {
    // TODO
    import.meta.hot.on("fullstack:update", (e) => {
      console.log("[fullstack:update]", e);
      window.location.reload();
    });
  }
}

main();
