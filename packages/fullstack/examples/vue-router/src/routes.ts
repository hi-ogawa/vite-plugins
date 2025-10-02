import type { RouteRecordRaw } from "vue-router";

// TODO: how to handle assets like react-router?
export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("./routes/index.vue"),
  },
  {
    path: "/about",
    name: "client",
    component: () => import("./routes/about.vue"),
  },
  {
    path: "/:catchAll(.*)",
    name: "not-found",
    component: () => import("./routes/not-found.vue"),
  },
];

// import {
//   type ImportAssetsResult,
//   mergeAssets,
// } from "@hiogawa/vite-plugin-fullstack/runtime";
// import type { RouteObject } from "react-router";

// // custom framework may employ fs router convention and/or transform plugin
// // to reduce boilerplace
// export const routes: RouteObject[] = [
//   {
//     id: "root",
//     path: "/",
//     lazy: () => import("./root"),
//     handle: {
//       assets: mergeAssets(
//         import.meta.vite.assets({
//           import: "./root",
//           environment: "client",
//         }),
//         import.meta.vite.assets({
//           import: "./root",
//           environment: "ssr",
//         }),
//         // include client entry for ssr modulepreload
//         import.meta.vite.assets({
//           import: "./framework/entry.client.tsx",
//           environment: "client",
//         }),
//       ),
//     } satisfies CustomHandle,
//     children: [
//       {
//         id: "index",
//         index: true,
//         lazy: () => import("./routes/index"),
//         handle: {
//           assets: mergeAssets(
//             import.meta.vite.assets({
//               import: "./routes/index",
//               environment: "client",
//             }),
//             import.meta.vite.assets({
//               import: "./routes/index",
//               environment: "ssr",
//             }),
//           ),
//         } satisfies CustomHandle,
//       },
//       {
//         id: "about",
//         path: "about",
//         lazy: () => import("./routes/about"),
//         handle: {
//           assets: mergeAssets(
//             import.meta.vite.assets({
//               import: "./routes/about",
//               environment: "client",
//             }),
//             import.meta.vite.assets({
//               import: "./routes/about",
//               environment: "ssr",
//             }),
//           ),
//         } satisfies CustomHandle,
//       },
//     ],
//   },
// ];

// export type CustomHandle = {
//   assets: ImportAssetsResult;
// };
