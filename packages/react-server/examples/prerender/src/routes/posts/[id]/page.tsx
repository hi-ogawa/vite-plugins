import type { PageProps } from "@hiogawa/react-server/server";
import { type PostType, fetchPosts } from "../layout";

// https://nextjs.org/docs/app/api-reference/functions/generate-static-params
export async function generateStaticParams() {
  // only first three posts are static
  const posts = await fetchPosts();
  return posts.slice(0, 3).map((p) => ({ id: p.id }));
}

export default async function Page(props: PageProps) {
  const res = await fetch(
    "https://jsonplaceholder.typicode.com/posts/" + props.params.id,
  );
  const post: PostType = await res.json();

  return (
    <div>
      <h4>{post.title}</h4>
      <div>{post.body}</div>
      <pre>
        [
        {globalThis?.process?.env?.["REACT_SERVER_PRERENDER"]
          ? "prerendered at"
          : "dynamically rendered at"}{" "}
        {new Date().toISOString()}]
      </pre>
    </div>
  );
}
