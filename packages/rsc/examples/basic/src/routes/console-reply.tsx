["wtf"];
export function TestReplayConsoleLogs2() {
  console.log("[debug-log-1]");
  inner();
  console.log("[debug-log-1.2]");
  return <a href="?test-replay-console-logs">test-replayConsoleLogs</a>;
}

export type Foo = {
  foo: "foo";
  bar: "foo";
};

function inner() {
  console.log("[debug-log-2]");
  ["wtf"];
  console.log("[debug-log-2.2]");
  inner2();
}

function inner2() {
  console.log("[debug-log-3]");
  //
  console.log("[debug-log-3.2]");
}

export type Bar = {
  foo: "foo";
  bar: "foo";
};
