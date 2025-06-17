import handler from "../react-router-vite/entry.rsc.node";

console.log("[debug:cf-rsc-entry:build]");

export default {
  fetch(request: Request) {
    return handler(request);
  },
};
