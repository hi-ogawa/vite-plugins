import UI from "./ui";

import {
  getCookie,
  getHeader,
  setCookie,
  setCookieAndRedirect,
} from "./actions";
import { validator } from "./validator";

export default function Page() {
  const prefix = "Prefix:";
  return (
    <UI
      getCookie={getCookie}
      getHeader={getHeader}
      setCookie={setCookie}
      setCookieAndRedirect={setCookieAndRedirect}
      // TODO: probably nested server action closure not working
      getAuthedUppercase={validator(async (str: string) => {
        "use server";
        return prefix + " " + str.toUpperCase();
      })}
    />
  );
}
