import { type LoaderFunction, json } from "react-router-dom";
import { getCounter } from "./loader-data-counter.api";

export type LoaderData = {
  counter: number;
};

export const loader: LoaderFunction = async () => {
  return json({ counter: getCounter() } satisfies LoaderData);
};
