export const SERVER_CSS_PROXY = "virtual:server-css-proxy.js";
// use a magic word `/.vite/` to exclude the virtual from tailwind v4's waitForRequestsIdle
// https://github.com/tailwindlabs/tailwindcss/blob/d684733d804a0b8951d13c94fe27350271e076b6/packages/%40tailwindcss-vite/src/index.ts#L313-L322
export const DEV_SSR_CSS = "virtual:dev-ssr-css/.vite/.css";
