"use server";

import { sleep, tinyassert } from "@hiogawa/utils";

let counter = 0;

export function getCounter() {
  return counter;
}

export function changeCounter(formData: FormData) {
  counter += Number(formData.get("delta"));
}

let messageId = 1;
let messages: [number, string][] = [];

export let getMessages = () => {
  return messages;
};

export const addMessage = (formData: FormData) => {
  const message = formData.get("message");
  tinyassert(typeof message === "string");
  messages.push([messageId++, message]);
  messages = messages.slice(-5);
};

export async function slowAction(formData: FormData) {
  await sleep(Number(formData.get("sleep")));
}

export async function actionCheckAnswer(_prev: unknown, formData: FormData) {
  await sleep(500);
  const answer = Number(formData.get("answer"));
  const message = answer === 2 ? "Correct!" : "Wrong!";
  return { message };
}

export async function actionStateTest(prevArg: unknown, formData: FormData) {
  const result = { prev: prevArg, form: [...formData.entries()] };
  console.log("[actionStateTest]", result);
  return result;
}

export async function actionBindTest(boundArg: string, formData: FormData) {
  console.log("[actionBindTest]", { boundArg, form: [...formData.entries()] });
}
