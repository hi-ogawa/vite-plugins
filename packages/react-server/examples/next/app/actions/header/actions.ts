"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export async function setCookieWithMaxAge() {
  cookies().set({
    name: "foo",
    value: "bar",
    maxAge: 1000,
  });
}

export async function getCookie(name: string) {
  return cookies().get(name);
}

export async function getHeader(name: string) {
  return headers().get(name);
}

export async function setCookie(name: string, value: string) {
  cookies().set(name, value);
  return cookies().get(name);
}

export async function setCookieAndRedirect(
  name: string,
  value: string,
  path: string,
) {
  cookies().set(name, value);
  redirect(path);
}
