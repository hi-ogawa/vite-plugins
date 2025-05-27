import { json, type LoaderFunction } from "react-router-dom";

export const loader: LoaderFunction = () => {
  return json({ message: "for layout" });
};
