"use server";

import { type ActionContext, redirect } from "@hiogawa/react-server/server";
import { tinyassert } from "@hiogawa/utils";
import { getSession, setSession } from "./utils";

export async function signin(formData: FormData) {
  // TODO: return error on invalid input
  const name = formData.get("name");
  tinyassert(typeof name === "string");

  throw redirect("/test/session", {
    headers: {
      "set-cookie": setSession({ name }),
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

let counter = 0;

export function getCounter() {
  return counter;
}

export async function incrementCounter(
  this: ActionContext,
  formData: FormData,
) {
  const session = getSession(this.request);
  if (!session?.name) {
    throw redirect("/test/session/signin");
  }
  counter += Number(formData.get("delta"));
}
