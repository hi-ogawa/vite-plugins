import type { PageProps } from "@hiogawa/react-server/server";
import { ClientLocation } from "./_cilent";

export function TestDynamic({
  file: file,
  props,
}: {
  file: string;
  props: PageProps;
}) {
  const url = new URL(props.request.url);
  const serverPathname = props.request.url.slice(url.origin.length);

  return (
    <div className="flex flex-col gap-1">
      <div>file: {file}</div>
      <div>pathname: {serverPathname}</div>
      <div>
        pathname (client): <ClientLocation />
      </div>
      <div>params: {JSON.stringify(props.params)}</div>
    </div>
  );
}
