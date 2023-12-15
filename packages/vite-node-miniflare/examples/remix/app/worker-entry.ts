import * as build from "virtual:remix/server-build";
import { createRequestHandler } from "@remix-run/server-runtime";

export default {
  fetch: createFetchHandler(),
};

function createFetchHandler() {
  const mode = import.meta.env.DEV ? "development" : "production";
  const remixHandler = createRequestHandler(build, mode);
  return remixHandler;
}
