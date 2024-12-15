import { TestClient } from "@hiogawa/test-dep-cjs/client";
import React from "react";

export function TestServer() {
  return React.createElement(TestClient);
}
