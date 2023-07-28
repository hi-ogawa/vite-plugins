import { type LoaderFunction, json, redirect } from "react-router-dom";
import { getRequestContext } from "../../server/request-context";

export type LoaderData = {
  name: string;
};

export const loader: LoaderFunction = () => {
  const ctx = getRequestContext();
  if (!ctx.session.user) {
    // TODO: redirect with toast
    throw redirect("/session/login?redirected");
  }
  return json({ name: ctx.session.user.name } satisfies LoaderData);
};
