import { TestVirtualUseClient } from "virtual:test-use-client";
import { TestDepMixed } from "@hiogawa/test-dep-mixed";
import { TestDepServerComponent } from "@hiogawa/test-dep-server-component";
import { TestDepUseClient } from "@hiogawa/test-dep-use-client";
import { TestDepReExportExplicit } from "@hiogawa/test-dep-use-client/re-export";
import {
  default as BalancerDefault,
  Balancer as BalancerNamed,
} from "react-wrap-balancer";
import { Client1 } from "./_client1";
import { Client2Provider } from "./_client2";

export default function Page() {
  return (
    <div className="flex flex-col items-start gap-2">
      <div>
        <TestVirtualUseClient />
      </div>
      <div>
        <TestDepUseClient />
      </div>
      <div>
        <TestDepReExportExplicit />
      </div>
      <div>
        <TestDepServerComponent />
      </div>
      <div>
        <TestDepMixed />
      </div>
      <div>
        <Client2Provider>
          <Client1 />
        </Client2Provider>
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
