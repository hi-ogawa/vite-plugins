import { MyContextProvider } from "@hiogawa/test-deps-context/client";
import React from "react";

// consume own provider in server entr
export function TestServer(props) {
  return React.createElement(MyContextProvider, null, props.children);
}
