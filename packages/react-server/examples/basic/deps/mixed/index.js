import React from "react";
import { TestClient } from "./client.js";

export function TestDepMixed() {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(TestServer, null),
    " ",
    React.createElement(TestClient, null),
  );
}

async function TestServer() {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return React.createElement("span", null, "TestDepMixed(Server)");
}
