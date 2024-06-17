import React from "react";

// TODO: need to make `AsyncLocalStorage` available globally before importing react-server
// https://github.com/facebook/react/blob/f14d7f0d2597ea25da12bcf97772e8803f2a394c/packages/react-server/src/forks/ReactFlightServerConfig.dom-edge.js#L16-L19

const sleep = React.cache(async () => {
  console.log("[sleep]");
  await new Promise((r) => setTimeout(r, 1000));
});

export default async function Page() {
  console.log("Page: 1");
  await sleep();
  console.log("Page: 2");
  await sleep();
  console.log("Page: 3");
  return (
    <div>
      <h3>Home Page</h3>
      <Inner />
    </div>
  );
}

async function Inner() {
  console.log("Inner: 1");
  await sleep(); // synchronous call can use cache context
  console.log("Inner: 2");
  await sleep();
  console.log("Inner: 3");
  return <div>Inner</div>;
}
