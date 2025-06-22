// @ts-ignore
import TestClientInServerDep from "@vitejs/test-dep-client-in-server/server";
import { TestClientInServerDepClient } from "./client";

export function TestClientInServer() {
  return (
    <div>
      <div data-testid="client-in-server">
        [test-client-in-server-dep: <TestClientInServerDep />]
      </div>
      <div data-testid="client-in-server-client">
        [test-client-in-server-dep-direct-client:{" "}
        <TestClientInServerDepClient />]
      </div>
    </div>
  );
}
