//
//
//
export function TestReplayConsoleLogs2() {
  console.log("[test-replay-console-logs-1]");
  inner();
  return <a href="?test-replay-console-logs">test-replayConsoleLogs</a>;
}

export type Foo = {
  foo: "foo";
  bar: "foo";
};

function inner() {
  console.log("[test-replay-console-logs-2]");
}

export type Bar = {
  foo: "foo";
  bar: "foo";
};
