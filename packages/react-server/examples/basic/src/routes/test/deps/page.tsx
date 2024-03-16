import { TestVirtualUseClient } from "virtual:test-use-client";
import { TestDepServerComponent } from "@hiogawa/test-dep-server-component";
import { TestDepUseClient } from "@hiogawa/test-dep-use-client";
import {
  Balancer as BalancerNamed,
  default as BalancerDefault,
} from "react-wrap-balancer";

export default function Page() {
  return (
    <div className="flex flex-col items-start gap-2">
      <h4 className="font-bold">Test Dependencies</h4>
      <div>
        <TestVirtualUseClient />
      </div>
      <div>
        <TestDepUseClient />
      </div>
      <div>
        <TestDepServerComponent />
      </div>
      <div className="border p-2">
        <a
          className="text-lg font-bold antd-link"
          href="https://github.com/shuding/react-wrap-balancer"
          target="_blank"
        >
          shuding/react-wrap-balancer
        </a>
        <div className="flex flex-col gap-2 p-2">
          <BalancerNamed>BalancerNamed</BalancerNamed>
          <BalancerDefault>BalancerDefault</BalancerDefault>
        </div>
      </div>
    </div>
  );
}
