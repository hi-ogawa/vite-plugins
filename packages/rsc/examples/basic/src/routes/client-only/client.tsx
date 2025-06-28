"use client";

import React from "react";

import { Dep } from "./dep" with { "vite-rsc": "browser-only" };

export function TestBrowserOnly() {
  return (
    <div>[test-browser-only]: {useHydrated() ? <Dep /> : "loading..."}</div>
  );
}

function useHydrated() {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}

// export function dynamic() {
//   const LazyDep = React.lazy(async () => {
//     if (import.meta.env.SSR) {
//     }
//     const mod = await import("./dep");
//     return { default: mod.Dep };
//   });

//   function Wrapper() {
//     if (import.meta.env.SSR) {
//       return <>fallback</>;
//     }
//     return (
//       <React.Suspense fallback={<>fallback</>}>
//         <LazyDep />
//       </React.Suspense>
//     );
//   }
//   return Wrapper;
// }

// usage:
// const Dep = BrowserOnly(() => import("./dep"), { fallback: <div>loading...</div> });
// <Dep />

// outcome:
// - build
//    - no ./dep chunk on
// - ssr
//   - render fallback
//   - render modulepreload of browser ./dep chunk
// - csr
//   - anyway

// transform entire module?

// - ssr build
// Dep = () => { fallback}
// - client build (and hoist dynamic import as static import so client reference )
// Dep => () => { useHydated() ? ActualDep : fallback }

// on server compoment
// import { ClientComp } from "./client";
// // this is already lazy loaded in a sense
// // we want to make this client reference to be swapped with fallback on ssr and initial hydration
