"use server";

import { sleep } from "@hiogawa/utils";
import React from "react";
import { TestClientComponent } from "./_client2";

export async function actionReturnComponent() {
  return (
    <>
      <div>
        <TestClientComponent />
      </div>
      <div className="border px-2">
        [server]{" "}
        <React.Suspense fallback={"Loading..."}>
          <TestServerComponent />
        </React.Suspense>
      </div>
    </>
  );
}

async function TestServerComponent() {
  await sleep(1000);
  return <>OK!</>;
}
