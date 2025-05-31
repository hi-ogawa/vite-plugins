import { permanentRedirect, RedirectType } from "next/navigation";

export default function Page() {
  permanentRedirect("/navigation/redirect/result", RedirectType.push);
  return <></>;
}
