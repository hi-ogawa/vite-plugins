/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react/experimental" />
/// <reference types="react-dom" />
/// <reference types="react-dom/experimental" />

declare global {
  interface RequestInit {
    /** @todo */
    next?: unknown;
  }
}

export * from "../dist/compat";
