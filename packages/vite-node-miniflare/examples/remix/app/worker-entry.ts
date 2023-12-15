import * as build from "virtual:remix/server-build";
import {
  createRequestHandler,
  unstable_setDevServerHooks,
} from "@remix-run/server-runtime";

// implement DevServerHooks
unstable_setDevServerHooks({
  async getCriticalCss(_build, _pathname) {
    return undefined;
    // const res = await fetch("http://localhost:5173/app/test-style.css?direct");
    // const style = await res.text();
    // return style;
  },
});

export default {
  fetch: createFetchHandler(),
};

function createFetchHandler() {
  const mode = import.meta.env.DEV ? "development" : "production";
  const remixHandler = createRequestHandler(build, mode);
  return remixHandler;
}
