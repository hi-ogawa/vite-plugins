import { type LoaderFunction, json } from "react-router-dom";

export const loader: LoaderFunction = () => {
  return json({ message: "hello loader" });
};
