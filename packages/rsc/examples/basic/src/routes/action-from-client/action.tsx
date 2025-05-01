"use server";

// test findSourceMapURL for server action imported from client

export async function notThis() {
  //
  //
  //
  notThis2();
}

export async function testAction() {
  console.log("[test-action-from-client]");
}

function notThis2() {
  //
  //
}

export async function testAction2() {
  console.log("[test-action-from-client-2]");
}
