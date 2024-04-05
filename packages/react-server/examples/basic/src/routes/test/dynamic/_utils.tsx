import type { PageProps } from "@hiogawa/react-server/server";

export function TestDynamic({
  importMetaUrl,
  props,
}: {
  importMetaUrl: string;
  props: PageProps;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div>file: {importMetaUrl.split("/src/routes").at(-1)}</div>
      <div>pathname: {new URL(props.request.url).pathname}</div>
      <div>params: {JSON.stringify(props.params)}</div>
    </div>
  );
}
