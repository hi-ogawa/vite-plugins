"use client";

export { TestDepReExportExplicit } from "./explicit.js";

// currently silently ignored (see https://github.com/hi-ogawa/vite-plugins/pull/579)
export * from "./all.js";
