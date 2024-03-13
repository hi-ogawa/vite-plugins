"use client";

// client references will be always imported via Vite's dynamic import
// which add `?import` query.
// To avoid dual package, this library needs to separately export utilities
// which is only used for client reference

export * from "./lib/components/link";
