"use client";

import React from "react";
import { Link } from "../../../components/link";
import { clientRpc } from "../../../rpc/client";

export function CounterRpc(props: { value: number }) {
  const [count, setCount] = React.useState(props.value);

  return (
    <div className="flex flex-col items-start gap-2">
      <div>Client Value: {count}</div>
      <div className="flex gap-2">
        <button
          className="antd-btn antd-btn-default px-2"
          onClick={async () => {
            setCount(await clientRpc.incrementCounter(-1));
          }}
        >
          -1
        </button>
        <button
          className="antd-btn antd-btn-default px-2"
          onClick={async () => {
            setCount(await clientRpc.incrementCounter(+1));
          }}
        >
          +1
        </button>
        <Link href="/test/rpc" className="antd-btn antd-btn-default px-2">
          Reload
        </Link>
      </div>
    </div>
  );
}
