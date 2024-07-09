"use server";

import { redirect } from "@hiogawa/react-server/server";
import { sleep } from "@hiogawa/utils";

export async function testRedirect() {
  await sleep(500);
  // TODO: redirection within same path is broken?
  throw redirect("/test/redirect?ok=server-action");
}
