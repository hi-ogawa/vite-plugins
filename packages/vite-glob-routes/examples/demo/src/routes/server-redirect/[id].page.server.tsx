import { json, type LoaderFunction, redirect } from "react-router-dom";
import { sleep } from "../../utils/misc";

export const loader: LoaderFunction = async ({ params }) => {
  await sleep(500);
  if (params["id"] !== "good") {
    throw redirect("/server-redirect?loader-throw");
  }
  return json({ ok: true, message: "good" });
};
