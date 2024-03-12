"use client";

import { changeCounter, hello } from "./action";

export function ClientFormImportAction() {
  return (
    <form action={hello}>
      <button className="antd-btn antd-btn-default px-2">
        action (client import)
      </button>
    </form>
  );
}

export function Counter(props: { value: number }) {
  return (
    <form action={changeCounter} className="flex flex-col items-start gap-2">
      <div>Count: {props.value}</div>
      <div className="flex gap-2">
        <button
          className="antd-btn antd-btn-default px-2"
          name="delta"
          value={-1}
        >
          -1
        </button>
        <button
          className="antd-btn antd-btn-default px-2"
          name="delta"
          value={+1}
        >
          +1
        </button>
      </div>
    </form>
  );
}

export function ClientFormPropAction({
  action,
}: {
  action: JSX.IntrinsicElements["form"]["action"];
}) {
  return (
    <form action={action}>
      <button className="antd-btn antd-btn-default px-2">
        aciton (server prop to client)
      </button>
    </form>
  );
}
