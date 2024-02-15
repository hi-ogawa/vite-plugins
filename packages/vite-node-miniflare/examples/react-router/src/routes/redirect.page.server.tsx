import { type LoaderFunction, redirect } from "react-router-dom";

// TODO: 302 response doesn't work for miniflare.dispatchFetch?

export const loader: LoaderFunction = () => {
  throw redirect("/");
};
