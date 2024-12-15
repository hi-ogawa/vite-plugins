import React from "react";
import { MyContextProvider } from "./client.js";

export function TestServer(props) {
  return React.createElement(MyContextProvider, null, props.children);
}
