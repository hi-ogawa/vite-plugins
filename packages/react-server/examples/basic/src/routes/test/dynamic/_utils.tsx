import type { PageProps } from "@hiogawa/react-server/server";

export function TestDynamic({
  importMetaUrl,
  props,
}: {
  importMetaUrl: string;
  props: PageProps;
}) {
  const result = {
    file: importMetaUrl.split("/src/routes/").at(-1),
    url: props.request.url,
    params: props.params,
  };
  return <pre className="text-sm p-2">{JSON.stringify(result, null, 2)}</pre>;
}
