"use server";

export let serverCounter = 0;

export async function changeServerCounter(change: number) {
  serverCounter += change;
}
