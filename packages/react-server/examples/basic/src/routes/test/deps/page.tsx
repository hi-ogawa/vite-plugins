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
      {/*
        TODO: ssr is failing to load default import.
        this could be a general Vite SSR issue https://publint.dev/react-wrap-balancer@1.1.0
      */}
      {false && (
        <div>
          <BalancerDefault>react-wrap-balancer default import</BalancerDefault>
        </div>
      )}
    </div>
  );
}
