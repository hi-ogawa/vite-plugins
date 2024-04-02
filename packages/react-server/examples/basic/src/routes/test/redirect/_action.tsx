"use server";

import { redirect } from "@hiogawa/react-server/server";
import { sleep } from "@hiogawa/utils";

export async function testRedirect() {
  await sleep(500);
  throw redirect("/test/redirect?to");
}
