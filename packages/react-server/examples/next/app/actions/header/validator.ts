import { cookies } from "next/headers";

export function validator(action: any) {
  return async function (arg: string) {
    "use server";
    const auth = cookies().get("auth");
    if (auth?.value !== "1") {
      throw new Error("Unauthorized request");
    }
    return action(arg);
  };
}
