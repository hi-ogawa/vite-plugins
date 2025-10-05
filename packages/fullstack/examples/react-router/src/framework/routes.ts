import type { RouteObject } from "react-router";

const glob = import.meta.glob("./**/page.tsx", { base: "../routes" });
const globAssets = import.meta.glob<typeof import("*?assets")>(
  "./**/page.tsx",
  { base: "../routes", query: "?assets" },
);
const pages = Object.entries(glob).map(([key, lazy]) => {
  // extract route path
  // "./about/page.tsx" => "/about"
  const path = key.slice(1).replace(/\/page\.tsx$/g, "") || "/";
  const assets = globAssets[key];
  return {
    id: key,
    path,
    lazy,
    handle: {
      assets,
    },
  };
});

export const routes: RouteObject[] = [
  {
    id: "root",
    path: "",
    lazy: () => import("../layout"),
    handle: {
      assets: () => import("../layout?assets"),
    },
    children: pages as any,
  },
];
