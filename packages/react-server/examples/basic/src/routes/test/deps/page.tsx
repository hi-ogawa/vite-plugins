// @ts-ignore
import { VirtualUseClient } from "virtual:use-client";
import { TestDepUseClient } from "@hiogawa/test-dep-use-client";

export default function Page() {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-bold">Test Dependencies</h4>
      <div>
        <VirtualUseClient />
      </div>
      <div>
        <TestDepUseClient />
      </div>
    </div>
  );
}
