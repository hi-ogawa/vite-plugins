import "@vitejs/plugin-react/preamble";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter, matchRoutes } from "react-router";
import { routes } from "./routes";

declare const __staticRouterHydrationData: any;

async function main() {
  // initialize lazy matches
  // https://github.com/remix-run/react-router/blob/d1c272a724c7bbbfb7705dd3bd0cdff156c70e17/examples/ssr-data-router/src/entry.client.tsx
  const matches = matchRoutes(routes, window.location) ?? [];
  await Promise.all(
    matches.map(async (m) => {
      if (typeof m.route.lazy === "function") {
        let routeModule = await m.route.lazy();
        Object.assign(m.route, { ...routeModule, lazy: undefined });
      }
    }),
  );

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
}

main();
