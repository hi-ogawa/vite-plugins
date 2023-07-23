import { json } from "react-router-dom";

export function get() {
  return json({ message: "hello api" });
}
