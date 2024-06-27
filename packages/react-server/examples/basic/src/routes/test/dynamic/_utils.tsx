import type { PageProps } from "@hiogawa/react-server/server";
import { ClientLocation, ClientParams } from "./_cilent";

export function TestDynamic({
  file: file,
  props,
}: {
  file: string;
  props: PageProps;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div>file: {file}</div>
      <div>
        pathname:{" "}
        {props.request.url.slice(new URL(props.request.url).origin.length)}
      </div>
      <div>
        pathname (client): <ClientLocation />
      </div>
      <div>props.params: {JSON.stringify(props.params)}</div>
      <ClientParams />
    </div>
  );
}
