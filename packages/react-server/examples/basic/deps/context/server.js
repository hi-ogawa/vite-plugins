import React from "react";
import { TestClientProvider } from "./client.js";

export function TestServer(props) {
  return React.createElement(TestClientProvider, null, props.children);
}
