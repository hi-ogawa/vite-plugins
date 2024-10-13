import React from "react";
import { CommonComponent } from "../../components/common";
import { Counter } from "../../components/counter";

export default async function Page() {
  return (
    <div className="flex flex-col gap-2">
      <CommonComponent message="from server" />
      <div className="text-sm">
        <pre>Server Time: {new Date().toISOString()}</pre>
        <pre>React.version: {React.version}</pre>
      </div>
      <Counter />
    </div>
  );
}
