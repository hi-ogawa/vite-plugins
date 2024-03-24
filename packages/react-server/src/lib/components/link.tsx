"use client";

import { __history } from "../csr";

// TODO: study prior art
// https://github.com/TanStack/router/blame/a1030ef24de104eb32f7a781cda247458e0ec90a/packages/react-router/src/link.tsx
// https://github.com/remix-run/react-router/blob/9e7486b89e712b765d947297f228650cdc0c488e/packages/react-router-dom/index.tsx#L1394

export function Link(props: JSX.IntrinsicElements["a"] & { href: string }) {
  return (
    <a
      {...props}
      onClick={(e) => {
        const target = e.currentTarget.target;
        if (
          e.button === 0 &&
          !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) &&
          (!target || target === "_self")
        ) {
          e.preventDefault();
          __history.push(props.href!);
        }
      }}
    />
  );
}

// for now, just global is fine
// RouterContext
// useRouter

// updateRsc

// navigate

// import { type RouterHistory, createBrowserHistory } from "@tanstack/history";
// import { tinyassert } from "@hiogawa/utils";
// import React from "react";

// class ClientRouter {
//   constructor(
//     public history: RouterHistory,
//     public startTransition: React.TransitionStartFunction,
//   ) {}

//   setup() {}

//   // private
//   push() {}
// }

// function BrowserRouterProvider() {}

// function SsrRouterProvider() {}

// // history

// // const GlobalTransitionContext
// // function

// function useRouterTransition() {}

// const ClientRouterContext = React.createContext<ClientRouter>(undefined!);

// // const clientRouter = new ClientRouter();

// // <ClientRouterContext.Provider value={clientRouter}></ClientRouterContext.Provider>

// export function RouterProvider(
//   props: React.PropsWithChildren<{ history: RouterHistory }>,
// ) {
//   //
//   const [isPending, startTransition] = React.useTransition();
//   //
//   const [router] = React.useState(
//     () => new ClientRouter(props.history, startTransition),
//   );
//   // TODO: how to pass isPending?
//   isPending;
//   return (
//     <ClientRouterContext.Provider value={router}>
//       {props.children}
//     </ClientRouterContext.Provider>
//   );
// }

// function useRouter() {
//   const [isPending, startTransition] = React.useTransition();

//   React.useState(() => {});

//   const clientRouter = React.useContext(ClientRouterContext);
//   tinyassert(clientRouter);
//   return clientRouter;
// }
