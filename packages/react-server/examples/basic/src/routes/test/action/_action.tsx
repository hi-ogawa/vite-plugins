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

type CheckAnswerState = {
  answer?: number;
  message: string;
  count: number;
};

export async function actionCheckAnswer(
  prev: CheckAnswerState | null,
  formData: FormData,
) {
  await sleep(500);
  const answer = Number(formData.get("answer"));
  const message = answer === 2 ? "Correct!" : "Wrong!";
  return { answer, message, count: (prev?.count ?? 0) + 1 };
}

let actionBindResult = "(none)";

export function getActionBindResult() {
  return actionBindResult;
}

export async function actionBindTest(bound: string) {
  actionBindResult = bound;
}

let nonFormActionCounter = 0;

export async function nonFormAction(_prev: unknown, delta: number) {
  await sleep(500);
  nonFormActionCounter += delta;
  return nonFormActionCounter;
}
