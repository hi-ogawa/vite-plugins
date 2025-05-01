"use server";

// test findSourceMapURL for server action imported from client

export async function NotThis() {
  //
  //
  //
  NotThis2();
}

export async function TestAction() {
  console.log("[test-action-from-client]");
}

function NotThis2() {
  //
  //
}

export async function TestAction2() {
  console.log("[test-action-from-client-2]");
}
