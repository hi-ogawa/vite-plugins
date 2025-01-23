// @ts-ignore
import { TestClient } from "@hiogawa/test-dep-context/client";
// @ts-ignore
import { TestServer } from "@hiogawa/test-dep-context/server";

export default function Page() {
  return (
    <TestServer>
      <TestClient />
    </TestServer>
  );
}
