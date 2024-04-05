import type { PageProps } from "@hiogawa/react-server/server";

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
      <div>pathname: {new URL(props.request.url).pathname}</div>
      <div>params: {JSON.stringify(props.params)}</div>
    </div>
  );
}
