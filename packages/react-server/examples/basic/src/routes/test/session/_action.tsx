"use server";

import { cookies, redirect } from "@hiogawa/react-server/server";
import { tinyassert } from "@hiogawa/utils";
import { SESSION_KEY } from "./utils";

export async function signin(formData: FormData) {
  // TODO: return error on invalid input
  const name = formData.get("name");
  tinyassert(typeof name === "string");

  cookies().set(SESSION_KEY, name);
  throw redirect("/test/session");
}

export async function signout() {
  cookies().delete(SESSION_KEY);
  throw redirect("/test/session");
}

let counter = 0;

export function getCounter() {
  return counter;
}

export async function incrementCounter(formData: FormData) {
  const name = cookies().get(SESSION_KEY)?.value;
  if (!name) {
    throw redirect("/test/session/signin");
  }
  counter += Number(formData.get("delta"));
}
