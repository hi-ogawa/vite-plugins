/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

declare global {
  interface RequestInit {
    /** @todo */
    next?: unknown;
  }
}

export * from "../dist/compat";
