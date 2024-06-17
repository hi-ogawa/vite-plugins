import { sleep } from "@hiogawa/utils";
import React from "react";

let state = 0;

const cacheFn = React.cache(async () => {
  state++;
  await new Promise((r) => setTimeout(r, 20));
});

export default async function Page() {
  await cacheFn();
  return (
    <div className="flex flex-col gap-2">
      <form
        action={() => {
          "use server";
          state = -1;
        }}
      >
        <button className="antd-btn antd-btn-default px-2">Reset</button>
      </form>
      <div>Page: state = {state}</div>
      <Inner />
    </div>
  );
}

async function Inner() {
  // synchronous call can actually access cache context without AsyncLocalStorage
  await cacheFn();
  // but this would require AsyncLocalStorage
  await cacheFn();

  return (
    <>
      <div>Inner1: state = {state}</div>
      <React.Suspense fallback={<div>Loading...</div>}>
        <Inner2 />
      </React.Suspense>
    </>
  );
}

async function Inner2() {
  await cacheFn();
  await sleep(500);
  await cacheFn();

  return <div>Inner2: state = {state}</div>;
}
