import React from "react";

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
