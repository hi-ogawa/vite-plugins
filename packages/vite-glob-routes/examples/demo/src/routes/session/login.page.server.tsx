import { json, type LoaderFunction, redirect } from "react-router-dom";
import { getRequestContext } from "../../server/request-context";

export const loader: LoaderFunction = () => {
  const ctx = getRequestContext();
  if (ctx.session.user) {
    // TODO: redirect with toast
    throw redirect("/session/me?redirected");
  }
  return json(null);
};
