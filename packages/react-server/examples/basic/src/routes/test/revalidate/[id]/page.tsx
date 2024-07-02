import { Link } from "@hiogawa/react-server/client";
import { type PageProps, revalidatePath } from "@hiogawa/react-server/server";

export default function Page(props: PageProps) {
  props.params.id === "x" ? "y" : "x";
  return (
    <div className="flex flex-col gap-2">
      <pre>params = {JSON.stringify(props.params)}</pre>
      <form
        action={() => {
          "use server";
          revalidatePath("/test/revalidate");
        }}
        className="flex flex-col gap-2"
      >
        <button className="antd-btn antd-btn-default px-2 self-start">
          action revalidate "/test/revalidate"
        </button>
      </form>
      <div className="flex flex-col gap-2">
        <Link
          className="antd-btn antd-btn-default px-2 self-start"
          href={`/test/revalidate/${props.params.id === "x" ? "y" : "x"}`}
          revalidate="/test/revalidate"
        >
          link revalidate "/test/revalidate"
        </Link>
      </div>
    </div>
  );
}
