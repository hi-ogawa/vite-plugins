import { createError } from "@hiogawa/react-server/server";
import { getPosts } from "../_utils";

export default async function Page(props: { params: { slug: string } }) {
  const posts = getPosts();
  const post = posts[props.params.slug];
  if (!post) {
    throw createError({ status: 404 });
  }
  const { default: Component } = await post();
  return (
    <Component
      components={{
        h1: (props) => <h1 className="font-bold">{props.children}</h1>,
      }}
    />
  );
}
