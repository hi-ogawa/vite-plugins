import {
  type PageProps,
  createError,
  redirect,
} from "@hiogawa/react-server/server";

export default function Page(props: PageProps) {
  const id = props.params["id"];
  if (id === "redirect") {
    throw redirect("/test/error/boundary/dir/ok");
  }
  if (id === "not-found") {
    throw createError({ status: 404 });
  }
  if (id === "unexpected") {
    throw new Error("boom!");
  }
  return (
    <>
      <div>boundary/dir/[id]/page.tsx</div>
      <pre>{JSON.stringify(props.params)}</pre>
    </>
  );
}
