import type { PageProps } from "@hiogawa/react-server/server";
import type { PostType } from "../layout";

export default async function Page(props: PageProps) {
  const res = await fetch(
    "https://jsonplaceholder.typicode.com/posts/" + props.params.id,
  );
  const post: PostType = await res.json();

  return (
    <div className="space-y-2">
      <h4 className="text-xl font-bold underline">{post.title}</h4>
      <div className="text-sm">{post.body}</div>
    </div>
  );
}
