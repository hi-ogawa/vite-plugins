import React from "react";

// when consuming client component internally,
// this cannot be optimized and thus cjs dep fails.
import { TestClient } from "./client.js";

export function TestServer() {
  return React.createElement(TestClient);
}
