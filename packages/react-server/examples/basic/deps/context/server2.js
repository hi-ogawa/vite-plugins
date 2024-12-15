import React from "react";
// difference from `server.js` is that this refers relatively `./client.js`
// instead of self reference of export `@hiogawa/test-deps-context/client`
import { MyContextProvider } from "./client.js";

// consume own provider in server entr
export function TestServer(props) {
  return React.createElement(MyContextProvider, null, props.children);
}
