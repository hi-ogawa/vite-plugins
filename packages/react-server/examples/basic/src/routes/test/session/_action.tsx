"use server";

import { getActionContext, redirect } from "@hiogawa/react-server/server";
import { tinyassert } from "@hiogawa/utils";
import { setSession } from "./utils";

export async function signin(formData: FormData) {
  // TODO: check if already signed in
  const ctx = getActionContext(formData);
  ctx.request.headers;

  // TODO: return error on invalid input
  const name = formData.get("name");
  tinyassert(typeof name === "string");

  throw redirect("/test/session", {
    headers: {
      "set-cookie": setSession({ user: { name } }),
    },
  });
}

export async function signout() {
  throw redirect("/test/session", {
    headers: {
      "set-cookie": setSession({}),
    },
  });
}
