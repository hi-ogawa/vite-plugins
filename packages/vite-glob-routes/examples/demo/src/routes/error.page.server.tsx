import { json, type LoaderFunction } from "react-router-dom";

export const loader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id === "error-response") {
    throw json({ message: "custom error message" }, { status: 400 });
  }
  if (id === "exception-loader") {
    throw new Error("loader boom!");
  }
  return json({ id });
};
