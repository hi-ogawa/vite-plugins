// @ts-ignore
import { VirtualUseClient } from "virtual:use-client";

// TODO: move to test/deps page

export default function Page() {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-lg">Virtual Module</h4>
      <VirtualUseClient />
    </div>
  );
}
