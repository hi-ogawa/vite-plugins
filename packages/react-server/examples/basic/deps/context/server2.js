// difference from `server.js` is that
// this uses self exports reference `@hiogawa/test-deps-context/client`
// instead of relative reference `./client.js`
import { MyContextProvider } from "@hiogawa/test-deps-context/client";
import React from "react";

// consume own provider in server entr
export function TestServer(props) {
  return React.createElement(MyContextProvider, null, props.children);
}
