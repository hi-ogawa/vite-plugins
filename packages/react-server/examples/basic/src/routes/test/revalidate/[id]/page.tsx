import { type PageProps, useActionContext } from "@hiogawa/react-server/server";

export default function Page(props: PageProps) {
  return (
    <div className="flex flex-col gap-2">
      <pre>params = {JSON.stringify(props.params)}</pre>
      <form
        action={() => {
          "use server";
          useActionContext().revalidate = "/test/revalidate";
        }}
        className="flex flex-col gap-2"
      >
        <button className="antd-btn antd-btn-default px-2 self-start">
          revalidate "/test/revalidate"
        </button>
      </form>
    </div>
  );
}
