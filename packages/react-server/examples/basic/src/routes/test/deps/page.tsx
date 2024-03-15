import { VirtualUseClient } from "virtual:use-client";
import { TestDepUseClient } from "@hiogawa/test-dep-use-client";
import {
  Balancer as BalancerNamed,
  default as BalancerDefault,
} from "react-wrap-balancer";

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
      <div>
        <BalancerNamed>react-wrap-balancer named import</BalancerNamed>
      </div>
      <div>
        <BalancerDefault>react-wrap-balancer default import</BalancerDefault>
      </div>
    </div>
  );
}
