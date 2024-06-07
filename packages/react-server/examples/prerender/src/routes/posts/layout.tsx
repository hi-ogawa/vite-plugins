import { Link } from "@hiogawa/react-server/client";
import type { LayoutProps } from "@hiogawa/react-server/server";

// https://github.com/TanStack/router/blob/4a2bb0412d83bfe4527b2db211f516992927e9a2/examples/react/basic-ssr-file-based/src/routes/posts.tsx
export type PostType = {
  id: string;
  title: string;
  body: string;
};

export async function fetchPosts() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts");
  const posts: PostType[] = await res.json();
  return posts.slice(0, 5);
}

export default async function Layout(props: LayoutProps) {
  const posts = await fetchPosts();

  return (
    <div>
      <h2>Posts</h2>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/posts/${post.id}`}>
              {post.title.substring(0, 20)}
            </Link>
          </li>
        ))}
      </ul>
      {props.children}
    </div>
  );
}
