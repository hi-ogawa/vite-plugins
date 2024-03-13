"use client";

// TODO
// client references will be always imported via Vite's dynamic import
// which add `?import` query.
// To avoid dual package, library should file to exports utilities
// which is only used for client reference.

export * from "../lib/components/link";
