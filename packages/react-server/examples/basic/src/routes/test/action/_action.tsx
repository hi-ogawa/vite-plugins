"use server";

import { tinyassert } from "@hiogawa/utils";

let counter = 0;

export function getCounter() {
  return counter;
}

export function changeCounter(formData: FormData) {
  counter += Number(formData.get("delta"));
}

let messageId = 1;
let messages: [number, string][] = [];

export function getMessages() {
  return messages;
}

export function addMessage(formData: FormData) {
  const message = formData.get("message");
  tinyassert(typeof message === "string");
  messages.push([messageId++, message]);
  messages = messages.slice(-5);
}
