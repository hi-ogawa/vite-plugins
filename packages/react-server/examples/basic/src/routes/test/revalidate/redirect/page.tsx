import { redirect, revalidatePath } from "@hiogawa/react-server/server";

export default function Page() {
  return (
    <div>
      <form
        action={() => {
          "use server";
          revalidatePath("/");
          throw redirect("/test/revalidate");
        }}
      >
        <button className="antd-btn antd-btn-default px-2">
          Revalidate and Redirect
        </button>
      </form>
    </div>
  );
}
