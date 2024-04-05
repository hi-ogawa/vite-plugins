import type { PageProps } from "@hiogawa/react-server/server";
import { Test } from "./_client";

export default function Page(props: PageProps) {
  console.log(props);
  return (
    <div>
      <h4>{import.meta.url}</h4>
      <div>
        <Test
          x={props.request.url}
          // y={new URL(props.request.url)}
          z={props.request.headers}
          props={props}
        />
      </div>
    </div>
  );
}
