"use client";

import { hello } from "./action";

export function ClientFormImportAction() {
  return (
    <form action={hello}>
      <button className="antd-btn antd-btn-default px-2">
        FormClientImportAction
      </button>
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
        ClientFormPropAction
      </button>
    </form>
  );
}
